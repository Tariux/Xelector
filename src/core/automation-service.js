module.exports = function createAutomationService(deps) {
  return {
    handleEvent: function (eventType, context) {
      deps.eventBus.emit('automation.eventHandled', { eventType: eventType, url: context.url });
      return { ok: true };
    },
    runMagicCopy: function (context, config) {
      const output = this.applyTemplate(config.template || '{{url}}', context);
      deps.clipboard.writeText(output);
      return { ok: true, output: output };
    },
    applyTemplate: function (templateOrId, context) {
      return deps.templates.render(templateOrId, context, { strict: false });
    }
  };
};
