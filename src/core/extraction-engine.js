module.exports = function createExtractionEngine(deps) {
  return {
    runForTab: function (tabId, options) {
      const context = {
        url: options.url || 'about:blank',
        profileId: options.profileId || null,
        startedAt: Date.now(),
        settings: {},
        outputs: {},
        steps: [],
        errors: []
      };

      if (!context.profileId && options.url) {
        const profile = deps.profiles.resolveProfileForUrl(options.url);
        context.profileId = profile ? profile.id : null;
      }

      if (context.profileId) {
        context.settings = deps.config.getEffectiveSettings({
          url: context.url,
          profileId: context.profileId,
          namespace: 'extraction'
        });
      }

      deps.eventBus.emit('extraction-completed', context);
      deps.automation.handleEvent('extraction-completed', context);
      return context;
    },
    runProfile: function (tabId, profileId, options) {
      return this.runForTab(tabId, Object.assign({}, options, { profileId: profileId }));
    },
    runStep: function (tabId, step, context) {
      return {
        stepId: step.id,
        status: 'skipped',
        reason: 'A browser tab execution adapter has not been attached yet',
        context: context
      };
    }
  };
};
