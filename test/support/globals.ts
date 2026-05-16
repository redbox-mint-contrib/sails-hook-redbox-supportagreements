const { _ } = require('@researchdatabox/redbox-dev-tools/testing');
const sinon = require('sinon');

type LogFn = (...args: unknown[]) => void;

function installSupportAgreementTestGlobals(overrides: Record<string, unknown> = {}): void {
  (global as Record<string, unknown>)._ = _;
  (global as Record<string, unknown>).SupportAgreement = {
    findOne: sinon.stub(),
    create: sinon.stub(),
    updateOne: sinon.stub()
  };

  (global as Record<string, unknown>).sails = {
    log: {
      verbose: sinon.stub(),
      debug: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub()
    } satisfies Record<string, LogFn>,
    services: {},
    models: {
      supportagreement: (global as Record<string, unknown>).SupportAgreement
    },
    config: {
      appPath: '/tmp',
      ...overrides
    }
  };

  (global as Record<string, unknown>).BrandingService = {
    getBrand: sinon.stub(),
    getBrandFromReq: sinon.stub()
  };

  (global as Record<string, unknown>).supportagreementservice = {
    getViewModel: sinon.stub(),
    getManagementViewModel: sinon.stub(),
    getForBrand: sinon.stub(),
    setYear: sinon.stub(),
    deleteYear: sinon.stub(),
    listReleaseNotes: sinon.stub(),
    createReleaseNote: sinon.stub(),
    updateReleaseNote: sinon.stub(),
    deleteReleaseNote: sinon.stub()
  };
}

function clearSupportAgreementTestGlobals(): void {
  delete (global as Record<string, unknown>)._;
  delete (global as Record<string, unknown>).sails;
  delete (global as Record<string, unknown>).BrandingService;
  delete (global as Record<string, unknown>).supportagreementservice;
  delete (global as Record<string, unknown>).SupportAgreement;
}

module.exports = {
  installSupportAgreementTestGlobals,
  clearSupportAgreementTestGlobals
};
