const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { ControllerExports } = require('../../src/api/controllers');
const { WebserviceControllerExports } = require('../../src/api/controllers/webservice');

describe('Controller exports', () => {
  it('registers the support agreement controller', () => {
    expect(ControllerExports).to.have.property('SupportAgreementController');
    expect(ControllerExports.SupportAgreementController).to.have.property('index');
  });

  it('registers the support agreement webservice controller', () => {
    expect(WebserviceControllerExports).to.have.property('SupportAgreementController');
    expect(WebserviceControllerExports.SupportAgreementController).to.have.property('getSettings');
  });
});
