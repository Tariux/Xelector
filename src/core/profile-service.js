const urlUtils = require('../shared/url-utils');

function loadState(storage) {
  return storage.readJson('profiles.json', {
    profiles: [],
    mappings: [],
    steps: []
  });
}

function saveState(storage, state) {
  storage.writeJson('profiles.json', state);
}

module.exports = function createProfileService(deps) {
  const storage = deps.storage;
  let state = loadState(storage);

  function refresh() {
    state = loadState(storage);
  }

  return {
    listProfiles: function () {
      refresh();
      return state.profiles.slice();
    },
    getProfile: function (profileId) {
      refresh();
      return state.profiles.find(function (profile) { return profile.id === profileId; }) || null;
    },
    saveProfile: function (profile) {
      const now = Date.now();
      const saved = Object.assign({
        id: 'profile-' + now,
        description: '',
        enabled: true,
        version: 1,
        settings: {}
      }, profile, {
        updatedAt: now,
        createdAt: profile.createdAt || now
      });
      const index = state.profiles.findIndex(function (existing) { return existing.id === saved.id; });

      if (index >= 0) {
        state.profiles[index] = saved;
      } else {
        state.profiles.push(saved);
      }

      if (profile.mappingPattern) {
        state.mappings.push({
          id: 'mapping-' + now,
          profileId: saved.id,
          matchType: profile.mappingMatchType || 'exact-domain',
          pattern: profile.mappingPattern,
          priority: Number(profile.mappingPriority || 0),
          enabled: true
        });
      }

      saveState(storage, state);
      deps.eventBus.emit('profile.updated', saved);
      return saved;
    },
    deleteProfile: function (profileId) {
      state.profiles = state.profiles.filter(function (profile) { return profile.id !== profileId; });
      state.mappings = state.mappings.filter(function (mapping) { return mapping.profileId !== profileId; });
      state.steps = state.steps.filter(function (step) { return step.profileId !== profileId; });
      saveState(storage, state);
      return { ok: true };
    },
    resolveProfileForUrl: function (url) {
      refresh();
      const matches = state.mappings.filter(function (mapping) {
        return mapping.enabled !== false && urlUtils.matchesRule({
          matchType: mapping.matchType,
          pattern: mapping.pattern
        }, url);
      }).sort(function (a, b) {
        const priorityDelta = (b.priority || 0) - (a.priority || 0);
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return urlUtils.specificity(b) - urlUtils.specificity(a);
      });

      if (matches.length === 0) {
        return null;
      }

      return state.profiles.find(function (profile) {
        return profile.enabled !== false && profile.id === matches[0].profileId;
      }) || null;
    },
    getPipelineSteps: function (profileId) {
      refresh();
      return state.steps.filter(function (step) {
        return step.profileId === profileId && step.enabled !== false;
      }).sort(function (a, b) {
        return Number(a.stepOrder || 0) - Number(b.stepOrder || 0);
      });
    }
  };
};
