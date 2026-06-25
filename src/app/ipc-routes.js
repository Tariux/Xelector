const { ipcMain } = require('electron');
const validators = require('../shared/validators');

function register(channel, schema, handler) {
  ipcMain.handle(channel, function (event, payload) {
    validators.validatePayload(payload || {}, schema);
    return handler(payload || {}, event);
  });
}

module.exports = function registerIpcRoutes(deps) {
  const services = deps.services;

  register('app:getStatus', {}, function () {
    return {
      name: 'Xelector',
      ready: true,
      services: services.describe()
    };
  });

  register('settings:listGlobal', { namespace: 'optionalString' }, function (payload) {
    return services.config.getGlobalSettings(payload.namespace || 'browser');
  });

  register('settings:setGlobal', {
    namespace: 'requiredString',
    key: 'requiredString',
    value: 'any'
  }, function (payload) {
    return services.config.setGlobalSetting(payload.namespace, payload.key, payload.value);
  });

  register('settings:listSiteRules', { namespace: 'optionalString' }, function (payload) {
    return services.config.listSiteRules(payload.namespace);
  });

  register('settings:saveSiteRule', {
    matchType: 'requiredString',
    pattern: 'requiredString',
    namespace: 'requiredString',
    key: 'requiredString',
    value: 'any'
  }, function (payload) {
    return services.config.saveSiteRule(payload);
  });

  register('settings:getEffective', {
    url: 'requiredString',
    namespace: 'optionalString',
    profileId: 'optionalString',
    extensionId: 'optionalString',
    sessionOverrides: 'optionalObject'
  }, function (payload) {
    return services.config.getEffectiveSettings(payload);
  });

  register('profiles:list', {}, function () {
    return services.profiles.listProfiles();
  });

  register('profiles:save', { name: 'requiredString' }, function (payload) {
    return services.profiles.saveProfile(payload);
  });

  register('profiles:resolveForUrl', { url: 'requiredString' }, function (payload) {
    return services.profiles.resolveProfileForUrl(payload.url);
  });

  register('extraction:runForTab', { profileId: 'optionalString' }, function (payload) {
    return services.extraction.runForTab(null, payload);
  });

  register('extensions:list', {}, function () {
    return services.extensions.list();
  });
};
