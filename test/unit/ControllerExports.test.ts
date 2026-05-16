const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { ControllerExports } = require('../../src/api/controllers');
const { WebserviceControllerExports } = require('../../src/api/controllers/webservice');
const hook = require('../../src');
const { routes } = require('../../src/config/routes');

describe('Controller exports', () => {
  it('registers the support agreement controller', () => {
    expect(ControllerExports).to.have.property('SupportAgreementController');
    expect(ControllerExports.SupportAgreementController).to.have.property('index');
    expect(ControllerExports.SupportAgreementController).to.have.property('saveYear');
    expect(ControllerExports.SupportAgreementController).to.have.property('deleteYear');
    expect(ControllerExports.SupportAgreementController).to.have.property('createReleaseNote');
    expect(ControllerExports.SupportAgreementController).to.have.property('updateReleaseNote');
    expect(ControllerExports.SupportAgreementController).to.have.property('deleteReleaseNote');
  });

  it('registers the support agreement webservice controller', () => {
    expect(WebserviceControllerExports).to.have.property('SupportAgreementController');
    expect(WebserviceControllerExports.SupportAgreementController).to.have.property('getSettings');
  });

  it('registers management routes', () => {
    expect(routes).to.include.keys(
      'get /:branding/:portal/admin/supportAgreement',
      'post /:branding/:portal/admin/supportAgreement/year',
      'post /:branding/:portal/admin/supportAgreement/year/delete',
      'post /:branding/:portal/admin/supportAgreement/release-note',
      'post /:branding/:portal/admin/supportAgreement/release-note/update',
      'post /:branding/:portal/admin/supportAgreement/release-note/delete'
    );
  });

  it('exposes default management usernames in hook config', () => {
    expect(hook).to.have.nested.property('defaults.__configKey__.supportAgreement.managementAllowedUsernames');
    expect(hook.defaults.__configKey__.supportAgreement.managementAllowedUsernames).to.deep.equal(['admin']);
  });
});
