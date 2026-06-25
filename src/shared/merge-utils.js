function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function deepMerge(base, override) {
  if (Array.isArray(override)) {
    return override.slice();
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const result = Object.assign({}, base);
  Object.keys(override).forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = deepMerge(base[key], override[key]);
      return;
    }

    result[key] = override[key];
  });

  return result;
}

module.exports = {
  deepMerge: deepMerge
};
