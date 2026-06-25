module.exports = function createScriptRunner(deps) {
  return {
    runCustomJavaScript: function (step, context, settings) {
      if (!settings.allowCustomJs || !deps.permissions.canRunCustomJavaScript(context.url)) {
        throw new Error('Custom JavaScript extraction is disabled for this context');
      }

      throw new Error('Custom JavaScript page execution is not available until a tab adapter is attached');
    }
  };
};
