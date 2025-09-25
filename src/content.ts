import type { Show as OriginalShow } from './types/chrome';
import { detectCharacterSpoiler } from './character-detection';

interface Show extends OriginalShow {
  active?: boolean; // Make it optional to be safe, or boolean if always present
}

interface ChromeMessage {
  type: 'UPDATE_SHOWS' | 'TOGGLE_SPOILER_PROTECTION' | 'UPDATE_PROTECTION_STYLE' | 'UPDATE_AI_SETTINGS';
  shows?: Show[];
  enabled?: boolean;
  style?: 'blur' | 'opaque';
  aiSettings?: AISettings;
}

interface AISettings {
  enabled: boolean;
  apiProvider: 'openai' | 'huggingface' | 'local';
  confidenceThreshold: number;
  apiKey?: string;
}

interface AIResponse {
  isSpoiler: boolean;
  confidence: number;
  reasoning?: string;
}

let isExtensionCurrentlyEnabled = true; // Default, will be updated from storage
let activeProtectionStyle: 'blur' | 'opaque' = 'blur'; // Default, will be updated from storage
let aiSettings: AISettings = {
  enabled: false,
  apiProvider: 'openai',
  confidenceThreshold: 0.7
};

// Function to restyle a single spoiler based on its revealed state and global settings
function restyleSingleSpoiler(container: HTMLElement) {
  if (!container) return;

  const overlay = container.querySelector('.plot-armor-spoiler-overlay') as HTMLElement;
  const textWrapper = container.querySelector('.plot-armor-text-wrapper') as HTMLElement; // Added a class for easier selection
  const revealButton = container.querySelector('.plot-armor-reveal-button') as HTMLElement;
  
  if (!overlay || !textWrapper || !revealButton) {
    // console.warn('Plot Armor: Missing elements for spoiler container', container);
    return;
  }

  const isIndividuallyRevealed = container.dataset.isRevealed === 'true';

  if (!isExtensionCurrentlyEnabled) {
    overlay.style.background = 'transparent';
    overlay.style.backdropFilter = 'none';
    (overlay.style as any).webkitBackdropFilter = 'none';
    overlay.style.pointerEvents = 'none';

    textWrapper.style.filter = 'none';
    (textWrapper.style as any).webkitFilter = 'none';
    (textWrapper.style as any).mozFilter = 'none';
    
    container.style.pointerEvents = 'none';
    revealButton.style.opacity = '0';
    revealButton.style.display = 'none';
  } else {
    container.style.pointerEvents = 'auto';
    revealButton.style.display = 'block'; // Controlled by hover too

    if (isIndividuallyRevealed) {
      overlay.style.background = 'transparent';
      overlay.style.backdropFilter = 'none';
      (overlay.style as any).webkitBackdropFilter = 'none';
      textWrapper.style.filter = 'none';
      (textWrapper.style as any).webkitFilter = 'none';
      (textWrapper.style as any).mozFilter = 'none';
      revealButton.style.opacity = '0';
      container.style.pointerEvents = 'none';
      overlay.style.pointerEvents = 'none';
    } else { // Not individually revealed, apply active global style
      overlay.style.pointerEvents = 'auto';
      textWrapper.style.filter = 'blur(8px)';
      (textWrapper.style as any).webkitFilter = 'blur(8px)';
      (textWrapper.style as any).mozFilter = 'blur(8px)';

      if (activeProtectionStyle === 'blur') {
        overlay.style.background = 'rgba(255, 255, 255, 0.05)';
        overlay.style.backdropFilter = 'blur(8px)';
        (overlay.style as any).webkitBackdropFilter = 'blur(8px)';
      } else {
        overlay.style.background = 'rgba(255, 255, 255, 0.3)';
        overlay.style.backdropFilter = 'blur(8px)';
        (overlay.style as any).webkitBackdropFilter = 'blur(8px)';
      }
    }
  }
}

// Applies the global enabled state and protection style to ALL spoilers
function applyGlobalSpoilerState() {
  const allSpoilerContainers = document.querySelectorAll('.plot-armor-spoiler-container');
  allSpoilerContainers.forEach(container => {
    if (container instanceof HTMLElement) {
      restyleSingleSpoiler(container);
    }
  });
}

// Enhanced keyword matching for Step 1 of hybrid filtering
function enhancedKeywordMatch(text: string, show: Show): boolean {
  const lowerText = text.toLowerCase();
  const title = show.title.toLowerCase();
  
  // Direct title match
  if (lowerText.includes(title)) {
    return true;
  }
  
  // Common variations and abbreviations
  const titleWords = title.split(' ');
  if (titleWords.length > 1) {
    // Check for partial matches (e.g., "Game of Thrones" -> "GOT", "Thrones")
    const abbreviations = generateAbbreviations(title);
    for (const abbr of abbreviations) {
      if (lowerText.includes(abbr)) {
        return true;
      }
    }
  }
  
  // Character name matching (basic implementation)
  // In a full implementation, you'd have a database of character names
  const commonCharacterPatterns = [
    `${title} character`,
    `${title} cast`,
    `${title} actor`,
    `${title} episode`,
    `${title} season`
  ];
  
  for (const pattern of commonCharacterPatterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}


// Generate common abbreviations for a title
function generateAbbreviations(title: string): string[] {
  const words = title.split(' ');
  const abbreviations: string[] = [];
  
  if (words.length > 1) {
    // First letters of each word
    const firstLetters = words.map(word => word.charAt(0)).join('');
    abbreviations.push(firstLetters);
    
    // Common TV show abbreviations
    if (title.includes('of')) {
      const withoutOf = title.replace(/\bof\b/g, '').replace(/\s+/g, '');
      abbreviations.push(withoutOf);
    }
  }
  
  return abbreviations;
}

// Step 2: AI spoiler detection
async function detectSpoilerWithAI(text: string, mediaTitle: string, mediaType: 'show' | 'movie'): Promise<AIResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'DETECT_SPOILER_AI',
      text,
      mediaTitle,
      mediaType,
      provider: aiSettings.apiProvider,
      apiKey: aiSettings.apiKey
    }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        // Fallback response if AI fails
        resolve({
          isSpoiler: false,
          confidence: 0.0,
          reasoning: 'AI detection failed, defaulting to safe'
        });
      }
    });
  });
}

// Enhanced hybrid spoiler detection with character awareness
async function hybridSpoilerDetection(text: string, show: Show, _allShows: Show[]): Promise<{ isSpoiler: boolean; method: string; confidence?: number; reasoning?: string }> {
  console.log(`Plot Armor: Testing text "${text.substring(0, 50)}..." against show "${show.title}"`);
  
  // Step 1: Character-based detection (for this specific show)
  const characterResult = detectCharacterSpoiler(text, [show.title]);
  console.log(`Plot Armor: Character detection result:`, characterResult);
  if (characterResult.isSpoiler) {
    console.log(`Plot Armor: Character-based spoiler detected for ${show.title}: ${characterResult.reasoning}`);
    return {
      isSpoiler: true,
      confidence: characterResult.confidence,
      method: 'character-detection',
      reasoning: characterResult.reasoning
    };
  }
  
  // Step 2: Traditional keyword matching (exact title matches)
  const keywordMatch = enhancedKeywordMatch(text, show);
  console.log(`Plot Armor: Keyword match result for "${show.title}":`, keywordMatch);
  
  if (!keywordMatch) {
    return { isSpoiler: false, method: 'keyword' };
  }
  
  // Step 3: AI detection (only if keyword match found and AI is enabled)
  if (aiSettings.enabled && aiSettings.apiProvider !== 'local') {
    try {
      const aiResponse = await detectSpoilerWithAI(text, show.title, show.type);
      
      // Check confidence threshold
      if (aiResponse.confidence >= aiSettings.confidenceThreshold) {
        return {
          isSpoiler: aiResponse.isSpoiler,
          method: 'ai',
          confidence: aiResponse.confidence,
          reasoning: aiResponse.reasoning
        };
      } else {
        // Low confidence, fall back to keyword matching
        return { isSpoiler: true, method: 'keyword-fallback' };
      }
    } catch (error) {
      console.warn('Plot Armor: AI detection failed, falling back to keyword matching:', error);
      return { isSpoiler: true, method: 'keyword-fallback' };
    }
  }
  
  // AI disabled or local mode - use keyword matching only
  return { isSpoiler: true, method: 'keyword' };
}

// Scan for spoilers based on text nodes with hybrid AI detection
async function scanForSpoilers(shows: Show[]) {
  const textNodes = document.evaluate(
    '//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::*[contains(@class, "plot-armor-")])]', // Avoid re-scanning our own elements
    document.body,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  // Process text nodes in batches to avoid overwhelming the AI API
  const batchSize = 5;
  const textNodesArray: Text[] = [];
  
  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const node = textNodes.snapshotItem(i);
    if (node && node.textContent && 
        !node.parentElement?.classList.contains('plot-armor-spoiler-container') &&
        !node.parentElement?.classList.contains('plot-armor-text-wrapper')) {
      textNodesArray.push(node as Text);
    }
  }

  // Process in batches
  for (let i = 0; i < textNodesArray.length; i += batchSize) {
    const batch = textNodesArray.slice(i, i + batchSize);
    await processTextNodeBatch(batch, shows);
  }
}

// Process a batch of text nodes
async function processTextNodeBatch(textNodes: Text[], shows: Show[]) {
  const promises = textNodes.map(async (node) => {
    const text = node.textContent!;
    
    // Try detection for each show
    for (const show of shows) {
      if (show.active === false) continue;
      
      // Use enhanced hybrid detection (includes character detection)
      const detectionResult = await hybridSpoilerDetection(text, show, shows);
      
      if (detectionResult.isSpoiler) {
        console.log(`Plot Armor: Spoiler detected (${detectionResult.method}) for "${show.title}":`, text.substring(0, 50) + '...');
        createSpoilerContainer(node, text, show, detectionResult);
        break; // Found a spoiler, no need to check other shows
      }
    }
  });
  
  await Promise.all(promises);
}

// Create spoiler container (extracted from original logic)
function createSpoilerContainer(node: Text, text: string, _show: Show, detectionResult: { isSpoiler: boolean; method: string; confidence?: number; reasoning?: string }) {
  const container = document.createElement('div');
  container.className = 'plot-armor-spoiler-container';
  container.dataset.isRevealed = 'false'; // Default to not revealed
  container.dataset.detectionMethod = detectionResult.method; // Store detection method
  container.dataset.confidence = detectionResult.confidence?.toString() || '0';
  container.style.cssText = `
    position: relative;
    display: inline-block;
    cursor: pointer;
    pointer-events: auto;
  `;

  const overlay = document.createElement('div');
  overlay.className = 'plot-armor-spoiler-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    -moz-backdrop-filter: blur(8px);
    border-radius: 6px;
    transition: all 0.2s ease-in-out;
    z-index: 10000;
    pointer-events: auto;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    -moz-transform: translateZ(0);
    will-change: backdrop-filter, background;
    isolation: isolate;
    mix-blend-mode: normal;
  `;

  const textWrapper = document.createElement('div');
  textWrapper.className = 'plot-armor-text-wrapper';
  textWrapper.style.cssText = `
    position: relative;
    filter: blur(8px);
    -webkit-filter: blur(8px);
    -moz-filter: blur(8px);
    transition: filter 0.2s ease-in-out;
    pointer-events: none;
  `;

  const revealButton = document.createElement('div');
  revealButton.className = 'plot-armor-reveal-button';
  revealButton.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
    white-space: nowrap;
    z-index: 10001;
  `;
  
  // Add detection method indicator to button text
  const methodIndicator = detectionResult.method === 'character-detection' ? ' (Character)' : 
                         detectionResult.method === 'ai' ? ' (AI)' : '';
  revealButton.textContent = `Click to reveal${methodIndicator}`;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  textWrapper.appendChild(textSpan);
  container.appendChild(textWrapper);
  container.appendChild(overlay);
  container.appendChild(revealButton);
  
  container.addEventListener('mouseenter', () => {
    if (isExtensionCurrentlyEnabled && container.dataset.isRevealed === 'false') {
      revealButton.style.opacity = '1';
    }
  });
  
  container.addEventListener('mouseleave', () => {
    revealButton.style.opacity = '0';
  });

  container.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isExtensionCurrentlyEnabled) return;

    const currentRevealedState = container.dataset.isRevealed === 'true';
    container.dataset.isRevealed = currentRevealedState ? 'false' : 'true';
    restyleSingleSpoiler(container);
  });

  node.parentNode?.replaceChild(container, node);
  restyleSingleSpoiler(container);
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, _sendResponse) => {
  if (message.type === 'UPDATE_SHOWS' && message.shows) {
    // Clear existing spoilers before rescanning
    clearExistingSpoilers();
    scanForSpoilers(message.shows);
    applyGlobalSpoilerState();
  }
  if (message.type === 'TOGGLE_SPOILER_PROTECTION') {
    isExtensionCurrentlyEnabled = message.enabled ?? false;
    chrome.storage.sync.set({ isExtensionCurrentlyEnabled: isExtensionCurrentlyEnabled });
    applyGlobalSpoilerState();
  }
  if (message.type === 'UPDATE_PROTECTION_STYLE' && message.style) {
    activeProtectionStyle = message.style;
    chrome.storage.sync.set({ activeProtectionStyle: activeProtectionStyle });
    if (isExtensionCurrentlyEnabled) {
      applyGlobalSpoilerState();
    }
  }
  if (message.type === 'UPDATE_AI_SETTINGS' && message.aiSettings) {
    aiSettings = message.aiSettings;
    chrome.storage.sync.set({ aiSettings: aiSettings });
    // Rescan with new AI settings
    chrome.storage.sync.get(['shows'], (result) => {
      if (result.shows) {
        clearExistingSpoilers();
        scanForSpoilers(result.shows);
        applyGlobalSpoilerState();
      }
    });
  }
});

// Clear existing spoiler containers
function clearExistingSpoilers() {
  const existingContainers = document.querySelectorAll('.plot-armor-spoiler-container');
  existingContainers.forEach(container => {
    const textWrapper = container.querySelector('.plot-armor-text-wrapper');
    if (textWrapper) {
      const textSpan = textWrapper.querySelector('span');
      if (textSpan) {
        const textNode = document.createTextNode(textSpan.textContent || '');
        container.parentNode?.replaceChild(textNode, container);
      }
    }
  });
}

// Initial setup
chrome.storage.sync.get(['shows', 'isExtensionCurrentlyEnabled', 'activeProtectionStyle', 'aiSettings'], (result) => {
  console.log('Plot Armor: Content script loaded with data:', result);
  
  if (result.isExtensionCurrentlyEnabled !== undefined) {
    isExtensionCurrentlyEnabled = result.isExtensionCurrentlyEnabled;
  }
  if (result.activeProtectionStyle) {
    activeProtectionStyle = result.activeProtectionStyle;
  }
  if (result.aiSettings) {
    aiSettings = result.aiSettings;
  }
  
  console.log('Plot Armor: Extension enabled:', isExtensionCurrentlyEnabled);
  console.log('Plot Armor: Shows to protect:', result.shows);
  
  // Always scan for shows on load, applyGlobalSpoilerState will handle visibility/styling
  if (result.shows && result.shows.length > 0) {
    console.log('Plot Armor: Starting spoiler scan for', result.shows.length, 'shows');
    scanForSpoilers(result.shows);
  } else {
    console.log('Plot Armor: No shows configured, skipping scan');
  }
  applyGlobalSpoilerState(); // Apply correct styles after initial scan and loading settings
}); 