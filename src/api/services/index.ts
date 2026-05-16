import { Services } from './SupportAgreementService';

export const ServiceExports = {
  supportagreementservice: new Services.SupportAgreement().exports()
};
