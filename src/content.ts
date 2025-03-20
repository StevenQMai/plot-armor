import type { Show } from './types/chrome';

interface ChromeMessage {
  type: 'UPDATE_SHOWS' | 'TOGGLE_SPOILER_PROTECTION';
  shows?: Show[];
  enabled?: boolean;
}

let isSpoilerProtectionEnabled = false;

function applyBlur() {
  const elements = document.querySelectorAll('.spoiler-content');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = 'blur(5px)';
    }
  });
}

function removeBlur() {
  const elements = document.querySelectorAll('.spoiler-content');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = 'none';
    }
  });
}

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
        // Create a spoiler overlay
        const overlay = document.createElement('div');
        overlay.className = 'plot-armor-spoiler';
        overlay.style.cssText = `
          position: absolute;
          background: #000;
          color: #000;
          padding: 2px 4px;
          border-radius: 4px;
          cursor: pointer;
          z-index: 10000;
        `;
        overlay.textContent = 'SPOILER BLOCKED';
        overlay.title = `Click to reveal spoiler for ${show.title}`;
        
        // Position the overlay
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        // Add click handler to reveal/hide
        overlay.addEventListener('click', () => {
          if (overlay.style.color === '#000') {
            overlay.style.color = '#fff';
            overlay.textContent = text;
          } else {
            overlay.style.color = '#000';
            overlay.textContent = 'SPOILER BLOCKED';
          }
        });

        document.body.appendChild(overlay);
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