const { clipboard } = require('electron');

module.exports = function createClipboardAdapter() {
  return {
    writeText: async function (text) {
      try {
        clipboard.writeText(String(text || ''));
        return { ok: true };
      } catch (e) {
        // Fallback to offscreen document
        const response = await chrome.runtime.sendMessage({
          type: 'XELECTOR_COPY_TO_CLIPBOARD',
          text: String(text || '')
        });
        return response && response.ok ? { ok: true } : { ok: false, error: response && response.error };
      }
    }
  };
};
