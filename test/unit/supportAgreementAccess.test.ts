const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const {
  installSupportAgreementTestGlobals,
  clearSupportAgreementTestGlobals
} = require('../support/globals');
const {
  getRequestUsername,
  getManagementAllowedUsernames,
  canManageSupportAgreements
} = require('../../src/api/controllers/supportAgreementAccess');

describe('supportAgreementAccess', () => {
  function asReq(value: Record<string, unknown>): Sails.Req {
    return value as unknown as Sails.Req;
  }

  afterEach(() => {
    clearSupportAgreementTestGlobals();
  });

  it('defaults missing config to admin', () => {
    installSupportAgreementTestGlobals();

    expect(getManagementAllowedUsernames()).to.deep.equal(['admin']);
  });

  it('allows admin by default', () => {
    installSupportAgreementTestGlobals();

    expect(canManageSupportAgreements(asReq({ user: { username: 'admin' } }))).to.equal(true);
  });

  it('denies non-admin by default', () => {
    installSupportAgreementTestGlobals();

    expect(canManageSupportAgreements(asReq({ user: { username: 'client-support' } }))).to.equal(false);
  });

  it('allows configured extra usernames', () => {
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: ['admin', 'client-support']
      }
    });

    expect(canManageSupportAgreements(asReq({ user: { username: 'admin' } }))).to.equal(true);
    expect(canManageSupportAgreements(asReq({ user: { username: 'client-support' } }))).to.equal(true);
  });

  it('falls back to admin for empty or invalid config', () => {
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: []
      }
    });
    expect(getManagementAllowedUsernames()).to.deep.equal(['admin']);

    clearSupportAgreementTestGlobals();
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: 'admin'
      }
    });
    expect(getManagementAllowedUsernames()).to.deep.equal(['admin']);

    clearSupportAgreementTestGlobals();
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: [123, false]
      }
    });
    expect(getManagementAllowedUsernames()).to.deep.equal(['admin']);
  });

  it('matches usernames case-sensitively', () => {
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: ['admin']
      }
    });

    expect(canManageSupportAgreements(asReq({ user: { username: 'Admin' } }))).to.equal(false);
  });

  it('reads username from tested request fallbacks', () => {
    installSupportAgreementTestGlobals();

    expect(getRequestUsername(asReq({ session: { user: { username: 'session-user' } } }))).to.equal('session-user');
    expect(getRequestUsername(asReq({ session: { passport: { user: { username: 'passport-user' } } } }))).to.equal('passport-user');
    expect(getRequestUsername(asReq({ session: { username: 'session-username' } }))).to.equal('session-username');
  });
});
