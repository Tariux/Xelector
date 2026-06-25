function validatePayload(payload, schema) {
  Object.keys(schema).forEach(function (key) {
    const rule = schema[key];
    const value = payload[key];

    if (rule === 'any') {
      return;
    }

    if (rule === 'requiredString' && (typeof value !== 'string' || value.length === 0)) {
      throw new Error('Invalid payload: ' + key + ' must be a non-empty string');
    }

    if (rule === 'optionalString' && value !== undefined && typeof value !== 'string') {
      throw new Error('Invalid payload: ' + key + ' must be a string');
    }

    if (rule === 'optionalObject' && value !== undefined && (value === null || typeof value !== 'object' || Array.isArray(value))) {
      throw new Error('Invalid payload: ' + key + ' must be an object');
    }
  });
}

module.exports = {
  validatePayload: validatePayload
};
