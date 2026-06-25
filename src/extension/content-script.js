(function () {
  if (window.__xelectorContentScriptLoaded) {
    return;
  }

  window.__xelectorContentScriptLoaded = true;

  var TOOLBAR_ID = 'xelector-toolbar';

  function wildcardToRegExp(pattern) {
    return new RegExp('^' + String(pattern).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
  }

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function matchesProfile(profile, url) {
    var pattern = String(profile.matchPattern || '').trim();

    if (!pattern) {
      return false;
    }

    if (pattern.indexOf('*') !== -1) {
      return wildcardToRegExp(pattern).test(url);
    }

    return url.indexOf(pattern) !== -1;
  }

  function getNodeValue(node, selectorRule) {
    if (selectorRule.attribute === 'html') {
      return node.innerHTML.trim();
    }

    if (selectorRule.attribute && selectorRule.attribute !== 'text') {
      return normalizeText(node.getAttribute(selectorRule.attribute));
    }

    return normalizeText(node.textContent);
  }

  function extractWithProfile(profile) {
    var outputs = {};
    var errors = [];

    (profile.selectors || []).forEach(function (selectorRule) {
      var name = String(selectorRule.name || '').trim();
      var selector = String(selectorRule.selector || '').trim();

      if (!name || !selector) {
        return;
      }

      try {
        var nodes = Array.from(document.querySelectorAll(selector));
        var values = nodes.map(function (node) {
          return getNodeValue(node, selectorRule);
        }).filter(Boolean);

        outputs[name] = selectorRule.multiple ? values.join('\n') : (values[0] || '');
      } catch (error) {
        outputs[name] = '';
        errors.push({ name: name, selector: selector, error: error.message });
      }
    });

    return {
      errors: errors,
      outputs: outputs,
      profile: profile,
      title: document.title,
      url: location.href
    };
  }

  function injectToolbarStyles() {
    var style = document.createElement('style');
    style.textContent =
      '#xelector-toolbar {\n' +
      '  position: fixed;\n' +
      '  top: 0;\n' +
      '  left: 0;\n' +
      '  right: 0;\n' +
      '  z-index: 2147483647;\n' +
      '  display: none;\n' +
      '  align-items: center;\n' +
      '  justify-content: flex-end;\n' +
      '  gap: 8px;\n' +
      '  padding: 6px 16px;\n' +
      '  background: #101b2d;\n' +
      '  border-bottom: 1px solid #24324a;\n' +
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.3);\n' +
      '  font-family: Inter, ui-sans-serif, system-ui, sans-serif;\n' +
      '  font-size: 13px;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-label {\n' +
      '  color: #93a4bd;\n' +
      '  margin-right: auto;\n' +
      '  font-weight: 600;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-export-btn {\n' +
      '  display: inline-flex;\n' +
      '  align-items: center;\n' +
      '  justify-content: center;\n' +
      '  min-height: 32px;\n' +
      '  padding: 4px 14px;\n' +
      '  border: 0;\n' +
      '  border-radius: 999px;\n' +
      '  background: linear-gradient(135deg, #7dd3fc, #38bdf8);\n' +
      '  color: #061321;\n' +
      '  cursor: pointer;\n' +
      '  font-weight: 800;\n' +
      '  font-size: 12px;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-export-btn:hover {\n' +
      '  opacity: 0.85;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-export-btn:active {\n' +
      '  opacity: 0.7;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-status {\n' +
      '  color: #93a4bd;\n' +
      '  font-size: 12px;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-status.ok {\n' +
      '  color: #4ade80;\n' +
      '}\n' +
      '#xelector-toolbar .xelector-status.error {\n' +
      '  color: #fb7185;\n' +
      '}\n' +
      'body.xelector-toolbar-shown {\n' +
      '  padding-top: 44px !important;\n' +
      '}';
    document.head.appendChild(style);
  }

  function createToolbar(profile) {
    var existing = document.getElementById(TOOLBAR_ID);
    if (existing) {
      return existing;
    }

    var toolbar = document.createElement('div');
    toolbar.id = TOOLBAR_ID;

    var label = document.createElement('span');
    label.className = 'xelector-label';
    label.textContent = 'Xelector: ' + profile.name;
    toolbar.appendChild(label);

    var status = document.createElement('span');
    status.className = 'xelector-status';
    toolbar.appendChild(status);

    var exportBtn = document.createElement('button');
    exportBtn.className = 'xelector-export-btn';
    exportBtn.textContent = 'Export current tab';
    exportBtn.addEventListener('click', function () {
      status.textContent = 'Extracting...';
      status.className = 'xelector-status';
      exportBtn.disabled = true;

      runExtraction({ manual: true, profileId: profile.id })
        .then(function (response) {
          exportBtn.disabled = false;
          if (response && response.ok) {
            status.textContent = response.copied ? 'Copied to clipboard' : 'Extracted';
            status.className = 'xelector-status ok';
          } else {
            status.textContent = (response && response.error) || 'Failed';
            status.className = 'xelector-status error';
          }
        })
        .catch(function (error) {
          exportBtn.disabled = false;
          status.textContent = error.message || 'Error';
          status.className = 'xelector-status error';
        });
    });
    toolbar.appendChild(exportBtn);

    document.body.appendChild(toolbar);
    return toolbar;
  }

  function showToolbar(profile) {
    var toolbar = createToolbar(profile);
    toolbar.style.display = 'flex';
    document.body.classList.add('xelector-toolbar-shown');
  }

  async function getProfiles() {
    var result = await chrome.storage.local.get({ profiles: [] });
    return Array.isArray(result.profiles) ? result.profiles : [];
  }

  async function runExtraction(options) {
    var profiles = await getProfiles();
    var requestedProfileId = options && options.profileId;
    var profile = requestedProfileId
      ? profiles.find(function (item) { return item.id === requestedProfileId; })
      : profiles.find(function (item) { return matchesProfile(item, location.href); });

    if (!profile) {
      return { ok: false, error: 'No matching Xelector profile for this page.' };
    }

    var payload = extractWithProfile(profile);
    payload.manual = Boolean(options && options.manual);

    return chrome.runtime.sendMessage({
      type: 'XELECTOR_EXTRACTION_RESULT',
      payload: payload
    });
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== 'XELECTOR_RUN_EXTRACTION') {
      return false;
    }

    runExtraction({ manual: true, profileId: message.profileId })
      .then(sendResponse)
      .catch(function (error) {
        sendResponse({ ok: false, error: error.message });
      });

    return true;
  });

  injectToolbarStyles();

  getProfiles().then(function (profiles) {
    var matchingProfile = profiles.find(function (item) {
      return matchesProfile(item, location.href);
    });

    if (!matchingProfile) {
      return;
    }

    showToolbar(matchingProfile);

    if (matchingProfile.autoCopy !== false) {
      runExtraction({ manual: false, profileId: matchingProfile.id }).catch(function () {});
    }
  });
}());
