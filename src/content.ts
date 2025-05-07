import type { Show } from './types/chrome';

interface ChromeMessage {
  type: 'UPDATE_SHOWS' | 'TOGGLE_SPOILER_PROTECTION';
  shows?: Show[];
  enabled?: boolean;
}

let isSpoilerProtectionEnabled = false;

function applyBlur() {
  const elements = document.querySelectorAll('.plot-armor-spoiler-overlay');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.backdropFilter = 'blur(8px)';
      (element.style as any).webkitBackdropFilter = 'blur(8px)';
      element.style.background = 'rgba(255, 255, 255, 0.3)';
    }
  });
}

function removeBlur() {
  const elements = document.querySelectorAll('.plot-armor-spoiler-overlay');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.backdropFilter = 'none';
      (element.style as any).webkitBackdropFilter = 'none';
      element.style.background = 'transparent';
    }
  });
}

// Scan for spoilers based on text nodes
function scanForSpoilers(shows: Show[]) {
  const textNodes = document.evaluate(
    '//text()[not(ancestor::script) and not(ancestor::style)]',
    document.body,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const node = textNodes.snapshotItem(i);
    if (!node) continue;

    const text = node.textContent || '';
    const lowerText = text.toLowerCase();

    for (const show of shows) {
      const title = show.title.toLowerCase();
      if (lowerText.includes(title)) {
        // Create a container for the spoiler content
        const container = document.createElement('div');
        container.className = 'plot-armor-spoiler-container';
        container.style.cssText = `
          position: relative;
          display: inline-block;
          cursor: pointer;
          pointer-events: auto;
        `;

        // Create the blurred overlay
        const overlay = document.createElement('div');
        overlay.className = 'plot-armor-spoiler-overlay';
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.8);
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
          will-change: backdrop-filter;
          isolation: isolate;
          mix-blend-mode: normal;
        `;

        // Create a wrapper for the text to apply blur
        const textWrapper = document.createElement('div');
        textWrapper.style.cssText = `
          position: relative;
          filter: blur(8px);
          -webkit-filter: blur(8px);
          -moz-filter: blur(8px);
          transition: filter 0.2s ease-in-out;
          pointer-events: none;
        `;

        // Create the reveal button
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
        revealButton.textContent = 'Click to reveal';

        // Position the container
        const range = document.createRange();
        range.selectNodeContents(node);
        // const rect = range.getBoundingClientRect();
        
        // Replace the text node with our container
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        textWrapper.appendChild(textSpan);
        container.appendChild(textWrapper);
        container.appendChild(overlay);
        container.appendChild(revealButton);
        
        // Add hover effect
        container.addEventListener('mouseenter', () => {
          revealButton.style.opacity = '1';
        });
        
        container.addEventListener('mouseleave', () => {
          revealButton.style.opacity = '0';
        });

        // Add click handler to reveal/hide
        let isRevealed = false;
        container.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          isRevealed = !isRevealed;
          if (isRevealed) {
            textWrapper.style.filter = 'none';
            (textWrapper.style as any).webkitFilter = 'none';
            (textWrapper.style as any).mozFilter = 'none';
            overlay.style.background = 'transparent';
            overlay.style.backdropFilter = 'none';
            (overlay.style as any).webkitBackdropFilter = 'none';
            (overlay.style as any).mozBackdropFilter = 'none';
            revealButton.style.display = 'none';
            // When revealed, allow clicks to pass through
            container.style.pointerEvents = 'none';
            overlay.style.pointerEvents = 'none';
          } else {
            textWrapper.style.filter = 'blur(8px)';
            (textWrapper.style as any).webkitFilter = 'blur(8px)';
            (textWrapper.style as any).mozFilter = 'blur(8px)';
            overlay.style.background = 'rgba(255, 255, 255, 0.8)';
            overlay.style.backdropFilter = 'blur(8px)';
            (overlay.style as any).webkitBackdropFilter = 'blur(8px)';
            (overlay.style as any).mozBackdropFilter = 'blur(8px)';
            revealButton.style.display = 'block';
            // When blurred, capture clicks
            container.style.pointerEvents = 'auto';
            overlay.style.pointerEvents = 'auto';
          }
        });

        // Replace the original text node with our container
        node.parentNode?.replaceChild(container, node);
      }
    }
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, _sendResponse) => {
  if (message.type === 'UPDATE_SHOWS' && message.shows) {
    scanForSpoilers(message.shows);
  }
  if (message.type === 'TOGGLE_SPOILER_PROTECTION') {
    isSpoilerProtectionEnabled = message.enabled ?? false;
    if (isSpoilerProtectionEnabled) {
      applyBlur();
    } else {
      removeBlur();
    }
  }
});

// Initial scan
chrome.storage.sync.get(['shows'], (result) => {
  if (result.shows) {
    scanForSpoilers(result.shows);
  }
}); 