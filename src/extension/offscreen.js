chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== 'XELECTOR_COPY_TO_CLIPBOARD') {
    return false;
  }

  var text = String(message.text || '');

  // Use execCommand('copy') via a hidden textarea — works without document focus
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    var ok = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (ok) {
      sendResponse({ ok: true });
    } else {
      sendResponse({ ok: false, error: 'execCommand copy returned false' });
    }
  } catch (error) {
    document.body.removeChild(textarea);
    sendResponse({ ok: false, error: error.message });
  }

  return true;
});
