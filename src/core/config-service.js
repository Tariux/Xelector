const mergeUtils = require('../shared/merge-utils');
const urlUtils = require('../shared/url-utils');

const DEFAULTS = {
  browser: {
    homepage: 'https://example.com',
    openManagementOnStart: true
  },
  extraction: {
    timeoutMs: 5000,
    allowCustomJs: false,
    selectorMode: 'sequential',
    clipboardFormat: 'markdown',
    continueOnRequiredFailure: false
  },
  automation: {
    enabled: true,
    confirmLargeOutputs: true
  },
  llm: {
    strictTemplates: false,
    defaultOutputFormat: 'prompt'
  }
};

function loadState(storage) {
  return storage.readJson('settings.json', {
    globalSettings: {},
    siteRules: []
  });
}

function saveState(storage, state) {
  storage.writeJson('settings.json', state);
}

module.exports = function createConfigService(deps) {
  const storage = deps.storage;
  let state = loadState(storage);

  function invalidateCache() {
    state = loadState(storage);
  }

  function getGlobalSettings(namespace) {
    return Object.assign({}, state.globalSettings[namespace] || {});
  }

  function listMatchingSiteRules(url, namespace) {
    const parsed = urlUtils.parseUrl(url);

    return state.siteRules.filter(function (rule) {
      return rule.enabled !== false && (!namespace || rule.namespace === namespace) && urlUtils.matchesRule(rule, parsed);
    }).sort(function (a, b) {
      const specificityDelta = urlUtils.specificity(a) - urlUtils.specificity(b);
      if (specificityDelta !== 0) {
        return specificityDelta;
      }

      const priorityDelta = (a.priority || 0) - (b.priority || 0);
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return (a.updatedAt || 0) - (b.updatedAt || 0);
    });
  }

  return {
    getGlobalSettings: getGlobalSettings,
    setGlobalSetting: function (namespace, key, value) {
      if (!state.globalSettings[namespace]) {
        state.globalSettings[namespace] = {};
      }

      state.globalSettings[namespace][key] = value;
      saveState(storage, state);
      deps.eventBus.emit('settings.updated', { namespace: namespace, key: key });
      return { namespace: namespace, key: key, value: value };
    },
    listSiteRules: function (namespace) {
      return state.siteRules.filter(function (rule) {
        return !namespace || rule.namespace === namespace;
      });
    },
    saveSiteRule: function (rule) {
      const now = Date.now();
      const saved = Object.assign({}, rule, {
        id: rule.id || 'site-rule-' + now,
        enabled: rule.enabled !== false,
        priority: Number(rule.priority || 0),
        updatedAt: now
      });
      const index = state.siteRules.findIndex(function (existing) { return existing.id === saved.id; });

      if (index >= 0) {
        state.siteRules[index] = saved;
      } else {
        state.siteRules.push(saved);
      }

      saveState(storage, state);
      deps.eventBus.emit('siteSettings.updated', saved);
      return saved;
    },
    getSiteSettingsForUrl: function (url, namespace) {
      return listMatchingSiteRules(url, namespace);
    },
    getEffectiveSettings: function (options) {
      const namespace = options.namespace || 'extraction';
      const sourceLayers = ['defaults'];
      let effective = Object.assign({}, DEFAULTS[namespace] || {});
      const globalSettings = getGlobalSettings(namespace);

      if (Object.keys(globalSettings).length > 0) {
        effective = mergeUtils.deepMerge(effective, globalSettings);
        sourceLayers.push('global:' + namespace);
      }

      if (options.profileId) {
        sourceLayers.push('profile:' + options.profileId);
      }

      listMatchingSiteRules(options.url, namespace).forEach(function (rule) {
        const layer = {};
        layer[rule.key] = rule.value;
        effective = mergeUtils.deepMerge(effective, layer);
        sourceLayers.push('site:' + rule.pattern);
      });

      if (options.sessionOverrides && Object.keys(options.sessionOverrides).length > 0) {
        effective = mergeUtils.deepMerge(effective, options.sessionOverrides);
        sourceLayers.push('session');
      }

      effective.sourceLayers = sourceLayers;
      return effective;
    },
    invalidateCache: invalidateCache
  };
};
