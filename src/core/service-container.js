const createEventBus = require('./event-bus');
const createDatabaseManager = require('./database-manager');
const createConfigService = require('./config-service');
const createProfileService = require('./profile-service');
const createExtractionEngine = require('./extraction-engine');
const createAutomationService = require('./automation-service');
const createTemplateService = require('./template-service');
const createExtensionManager = require('./extension-manager');
const createPermissionService = require('./permission-service');
const createStorageAdapter = require('../adapters/storage-adapter');
const createClipboardAdapter = require('../adapters/clipboard-adapter');
const createScriptRunner = require('../adapters/script-runner');

module.exports = function createServiceContainer(options) {
  const eventBus = createEventBus();
  const storage = createStorageAdapter({ app: options.app });
  const database = createDatabaseManager({ storage: storage, eventBus: eventBus });
  database.initCore();

  const permissions = createPermissionService();
  const config = createConfigService({ storage: storage, eventBus: eventBus });
  const profiles = createProfileService({ storage: storage, eventBus: eventBus });
  const templates = createTemplateService();
  const clipboard = createClipboardAdapter();
  const automation = createAutomationService({ clipboard: clipboard, templates: templates, eventBus: eventBus });
  const scriptRunner = createScriptRunner({ permissions: permissions });
  const extraction = createExtractionEngine({ profiles: profiles, config: config, automation: automation, scriptRunner: scriptRunner, eventBus: eventBus });
  const extensions = createExtensionManager({ database: database, eventBus: eventBus, storage: storage });

  return {
    automation: automation,
    clipboard: clipboard,
    config: config,
    database: database,
    describe: function () {
      return ['config', 'profiles', 'extraction', 'automation', 'templates', 'extensions', 'database'];
    },
    eventBus: eventBus,
    extraction: extraction,
    extensions: extensions,
    permissions: permissions,
    profiles: profiles,
    storage: storage,
    templates: templates
  };
};
