import '@researchdatabox/redbox-core';
import { defineRedboxHook, type HookRegistrationMap } from '@researchdatabox/redbox-core';
import { auth } from './config/auth';
import { routes } from './config/routes';

export {};

type RedboxHookOptionsWithModels = Parameters<typeof defineRedboxHook>[0] & {
  registerRedboxModels?: () => HookRegistrationMap;
};

type RedboxHookWithModels = ReturnType<typeof defineRedboxHook> & {
  registerRedboxModels?: () => HookRegistrationMap;
  defaults?: typeof hookOptions.defaults;
};

const hookOptions = {
  initialize(sails: Sails.Application, cb: () => void) {
    const configService = (sails.services as Record<string, unknown>)?.configservice as {
      mergeHookConfig?: (hookName: string, configMap: Record<string, unknown>) => void;
    } | undefined;

    if (configService?.mergeHookConfig) {
      configService.mergeHookConfig('@researchdatabox/sails-hook-redbox-supportagreements', sails.config);
    } else {
      sails.log.warn('sails-hook-redbox-supportagreements: ConfigService not available, skipping config merge');
    }

    cb();
  },
  routes: {},
  defaults: {
    __configKey__: {
      _hookTimeout: 120000,
      supportAgreement: {
        managementAllowedUsernames: ['admin']
      }
    }
  },
  registerRedboxConfig(): HookRegistrationMap {
    return {
      routes,
      auth
    };
  },
  registerHookApiRoutes() {
    return require('./api-routes').supportAgreementApiRoutes;
  },
  registerRedboxModels(): HookRegistrationMap {
    return require('./api/models').ModelExports as HookRegistrationMap;
  },
  registerRedboxControllers(): HookRegistrationMap {
    return require('./api/controllers').ControllerExports as HookRegistrationMap;
  },
  registerRedboxWebserviceControllers(): HookRegistrationMap {
    return require('./api/controllers/webservice').WebserviceControllerExports as HookRegistrationMap;
  },
  registerRedboxServices(): HookRegistrationMap {
    return require('./api/services').ServiceExports as HookRegistrationMap;
  },
  additionalExports: {
    ControllerExports: require('./api/controllers').ControllerExports,
    WebserviceControllerExports: require('./api/controllers/webservice').WebserviceControllerExports,
    ServiceExports: require('./api/services').ServiceExports,
    ModelExports: require('./api/models').ModelExports,
    supportAgreementApiRoutes: require('./api-routes').supportAgreementApiRoutes
  }
} as unknown as RedboxHookOptionsWithModels;

const hook = defineRedboxHook(hookOptions) as RedboxHookWithModels;
hook.defaults = hookOptions.defaults;

hook.registerRedboxModels = function registerRedboxModels(): HookRegistrationMap {
  return require('./api/models').ModelExports as HookRegistrationMap;
};

module.exports = hook;
