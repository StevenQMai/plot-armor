import type { Show as OriginalShow } from './types/chrome';

interface Show extends OriginalShow {
  active?: boolean; // Make it optional to be safe, or boolean if always present
}

interface ChromeMessage {
  type: 'UPDATE_SHOWS' | 'TOGGLE_SPOILER_PROTECTION' | 'UPDATE_PROTECTION_STYLE';
  shows?: Show[];
  enabled?: boolean;
  style?: 'blur' | 'opaque';
}

let isExtensionCurrentlyEnabled = true; // Default, will be updated from storage
let activeProtectionStyle: 'blur' | 'opaque' = 'blur'; // Default, will be updated from storage

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

// Scan for spoilers based on text nodes
function scanForSpoilers(shows: Show[]) {
  const textNodes = document.evaluate(
    '//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::*[contains(@class, "plot-armor-")])]', // Avoid re-scanning our own elements
    document.body,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const node = textNodes.snapshotItem(i);
    if (!node || !node.textContent) continue;
    // Check if parent is already a spoiler container to prevent re-wrapping
    if (node.parentElement && node.parentElement.classList.contains('plot-armor-spoiler-container')) {
        continue;
    }
    if (node.parentElement && node.parentElement.classList.contains('plot-armor-text-wrapper')) {
        continue;
    }

    const text = node.textContent;
    const lowerText = text.toLowerCase();

    for (const show of shows) {
      if (show.active === false) continue;
      const title = show.title.toLowerCase();
      if (lowerText.includes(title)) {
        const container = document.createElement('div');
        container.className = 'plot-armor-spoiler-container';
        container.dataset.isRevealed = 'false'; // Default to not revealed
        container.style.cssText = `
          position: relative;
          display: inline-block; /* Changed from inline to inline-block for better layout */
          cursor: pointer;
          pointer-events: auto; /* Initially interactive */
        `;

        const overlay = document.createElement('div');
        overlay.className = 'plot-armor-spoiler-overlay';
        // Initial style set here will be overridden by applyGlobalSpoilerState or restyleSingleSpoiler
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.3); /* Default to blur appearance */
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          -moz-backdrop-filter: blur(8px);
          border-radius: 6px;
          transition: all 0.2s ease-in-out;
          z-index: 10000;
          pointer-events: auto; /* Overlay captures clicks initially */
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          -moz-transform: translateZ(0);
          will-change: backdrop-filter, background;
          isolation: isolate;
          mix-blend-mode: normal;
        `;

        const textWrapper = document.createElement('div');
        textWrapper.className = 'plot-armor-text-wrapper'; // Added class
        textWrapper.style.cssText = `
          position: relative;
          filter: blur(8px); /* Default to blurred text */
          -webkit-filter: blur(8px);
          -moz-filter: blur(8px);
          transition: filter 0.2s ease-in-out;
          pointer-events: none; /* Text itself is not interactive */
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
          opacity: 0; /* Initially hidden */
          transition: opacity 0.2s ease-in-out;
          pointer-events: none;
          white-space: nowrap;
          z-index: 10001;
        `;
        revealButton.textContent = 'Click to reveal';
        
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
          if (!isExtensionCurrentlyEnabled) return; // No interaction if extension is off

          const currentRevealedState = container.dataset.isRevealed === 'true';
          container.dataset.isRevealed = currentRevealedState ? 'false' : 'true';
          restyleSingleSpoiler(container); // Restyle this specific spoiler
        });

        node.parentNode?.replaceChild(container, node);
        restyleSingleSpoiler(container); // Ensure initial style is correct after creation
        break; // Found a show, no need to check other shows for this text node
      }
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, _sendResponse) => {
  if (message.type === 'UPDATE_SHOWS' && message.shows) {
    // Potentially clear old spoilers or make scanForSpoilers idempotent
    scanForSpoilers(message.shows);
    applyGlobalSpoilerState(); // Ensure all spoilers reflect current global state
  }
  if (message.type === 'TOGGLE_SPOILER_PROTECTION') {
    isExtensionCurrentlyEnabled = message.enabled ?? false;
    chrome.storage.sync.set({ isExtensionCurrentlyEnabled: isExtensionCurrentlyEnabled });
    applyGlobalSpoilerState();
  }
  if (message.type === 'UPDATE_PROTECTION_STYLE' && message.style) {
    activeProtectionStyle = message.style;
    chrome.storage.sync.set({ activeProtectionStyle: activeProtectionStyle });
    if (isExtensionCurrentlyEnabled) { // Only apply if extension is on
      applyGlobalSpoilerState();
    }
  }
});

// Initial setup
chrome.storage.sync.get(['shows', 'isExtensionCurrentlyEnabled', 'activeProtectionStyle'], (result) => {
  if (result.isExtensionCurrentlyEnabled !== undefined) {
    isExtensionCurrentlyEnabled = result.isExtensionCurrentlyEnabled;
  }
  if (result.activeProtectionStyle) {
    activeProtectionStyle = result.activeProtectionStyle;
  }
  
  // Always scan for shows on load, applyGlobalSpoilerState will handle visibility/styling
  if (result.shows) {
    scanForSpoilers(result.shows);
  }
  applyGlobalSpoilerState(); // Apply correct styles after initial scan and loading settings
}); 