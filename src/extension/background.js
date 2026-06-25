const OFFSCREEN_DOCUMENT_PATH = 'src/extension/offscreen.html';

function renderTemplate(template, context) {
  return String(template || '').replace(/\{\{\s*([^}|\s]+)(?:\|([^}]*))?\s*\}\}/g, function (match, name, fallback) {
    if (Object.prototype.hasOwnProperty.call(context.outputs || {}, name)) {
      return String(context.outputs[name] || '');
    }

    if (name === 'url') {
      return context.url || '';
    }

    if (name === 'pageTitle' || name === 'title') {
      return context.title || '';
    }

    if (name === 'summary') {
      return Object.values(context.outputs).join('\n') || '';
    }

    return fallback === undefined ? '' : fallback;
  });
}

function formatOutput(payload) {
  const profile = payload.profile || {};
  const outputs = payload.outputs || {};
  const format = profile.outputFormat || 'text';

  if (profile.template && profile.template.trim()) {
    return renderTemplate(profile.template, {
      outputs: outputs,
      title: payload.title,
      url: payload.url
    });
  }

  if (format === 'json') {
    return JSON.stringify({
      profile: profile.name || '',
      url: payload.url || '',
      title: payload.title || '',
      outputs: outputs
    }, null, 2);
  }

  const names = Object.keys(outputs);

  if (format === 'markdown') {
    return names.map(function (name) {
      return '## ' + name + '\n\n' + outputs[name];
    }).join('\n\n');
  }

  return names.map(function (name) {
    return name + ':\n' + outputs[name];
  }).join('\n\n');
}

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) {
    return false;
  }

  if (chrome.offscreen.hasDocument && await chrome.offscreen.hasDocument()) {
    return true;
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [chrome.offscreen.Reason.CLIPBOARD],
    justification: 'Copy extracted selector output to the clipboard.'
  });
  return true;
}

async function copyToClipboard(text) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    type: 'XELECTOR_COPY_TO_CLIPBOARD',
    text: text
  });

  if (!response || !response.ok) {
    throw new Error(response && response.error ? response.error : 'Clipboard write failed');
  }
}

async function handleExtraction(payload) {
  const text = formatOutput(payload);

  await chrome.storage.local.set({
    lastExtraction: {
      copiedAt: new Date().toISOString(),
      errors: payload.errors || [],
      profileId: payload.profile && payload.profile.id,
      profileName: payload.profile && payload.profile.name,
      text: text,
      title: payload.title || '',
      url: payload.url || ''
    }
  });

  if (!payload.manual && payload.profile && payload.profile.autoCopy === false) {
    return { ok: true, copied: false, text: text };
  }

  await copyToClipboard(text);
  return { ok: true, copied: true, text: text };
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== 'XELECTOR_EXTRACTION_RESULT') {
    return false;
  }

  handleExtraction(message.payload || {})
    .then(sendResponse)
    .catch(function (error) {
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});
