module.exports = function createTemplateService() {
  function resolveVariable(name, context) {
    if (name === 'url') {
      return context.url;
    }

    if (context.outputs && Object.prototype.hasOwnProperty.call(context.outputs, name)) {
      return context.outputs[name];
    }

    if (Object.prototype.hasOwnProperty.call(context, name)) {
      return context[name];
    }

    return undefined;
  }

  return {
    render: function (templateText, context, options) {
      return String(templateText || '').replace(/\{\{\s*([^}|\s]+)(?:\|([^}]*))?\s*\}\}/g, function (match, name, fallback) {
        const value = resolveVariable(name, context || {});

        if (value === undefined || value === null) {
          if (fallback !== undefined) {
            return fallback;
          }

          if (options && options.strict) {
            throw new Error('Unknown template variable: ' + name);
          }

          return '';
        }

        return String(value);
      });
    }
  };
};
