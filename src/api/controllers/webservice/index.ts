import { Controllers } from './SupportAgreementController';

export const WebserviceControllerExports = {
  SupportAgreementController: new Controllers.SupportAgreement().exports()
};
