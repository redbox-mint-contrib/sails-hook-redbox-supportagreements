const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { ModelExports } = require('../../src/api/models');

describe('Model exports', () => {
  it('registers the SupportAgreement model definition', () => {
    expect(ModelExports).to.have.property('SupportAgreement');
    expect(ModelExports.SupportAgreement.identity).to.equal('supportagreement');
    expect(ModelExports.SupportAgreement.attributes).to.include.keys('branding', 'key', 'supportYears', 'releaseNotes');
  });
});
