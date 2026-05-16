const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const sinon = require('sinon');
const {
  installSupportAgreementTestGlobals,
  clearSupportAgreementTestGlobals
} = require('../support/globals');
const { Controllers } = require('../../src/api/controllers/webservice/SupportAgreementController');

type SinonStub = ReturnType<typeof sinon.stub>;

describe('Webservice SupportAgreementController', () => {
  let controller: InstanceType<typeof Controllers.SupportAgreement>;
  let sendRespStub: SinonStub;
  let getBrandFromReqStub: SinonStub;
  let supportAgreementService: Record<string, SinonStub>;

  beforeEach(() => {
    installSupportAgreementTestGlobals();
    controller = new Controllers.SupportAgreement();
    sendRespStub = sinon.stub(controller, 'sendResp');
    getBrandFromReqStub = BrandingService.getBrandFromReq as SinonStub;
    getBrandFromReqStub.returns({ id: 'brand-1', name: 'default' });
    supportAgreementService = (globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice;
  });

  afterEach(() => {
    sinon.restore();
    clearSupportAgreementTestGlobals();
  });

  function createReq(overrides: Record<string, unknown> = {}): Sails.Req {
    return {
      user: { username: 'admin' },
      param: () => undefined,
      body: {},
      ...overrides
    } as unknown as Sails.Req;
  }

  it('GET settings returns support years and release notes', async () => {
    supportAgreementService.getForBrand.resolves({ supportYears: { 2026: { agreedSupportDays: 20, usedSupportDays: 4 } }, releaseNotes: [] });

    await controller.getSettings(createReq(), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ supportYears: { 2026: { agreedSupportDays: 20, usedSupportDays: 4 } }, releaseNotes: [] });
  });

  it('PUT years returns saved data', async () => {
    supportAgreementService.setYear.resolves({ agreedSupportDays: 20, usedSupportDays: 4 });

    await controller.setYear(createReq({ param: () => '2026', body: { agreedSupportDays: 20, usedSupportDays: 4 } }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ agreedSupportDays: 20, usedSupportDays: 4 });
  });

  it('invalid year update returns 400', async () => {
    supportAgreementService.setYear.rejects(new Error('Year must be a finite integer'));

    await controller.setYear(createReq({ param: () => 'bad', body: {} }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(400);
  });

  it('DELETE year returns status true', async () => {
    supportAgreementService.deleteYear.resolves(true);

    await controller.deleteYear(createReq({ param: () => '2026' }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ status: true });
  });

  it('GET release notes returns notes', async () => {
    supportAgreementService.listReleaseNotes.resolves([{ id: 'rn-1' }]);

    await controller.listReleaseNotes(createReq({ param: () => undefined }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal([{ id: 'rn-1' }]);
  });

  it('POST release notes returns 201', async () => {
    supportAgreementService.createReleaseNote.resolves({ id: 'rn-1' });

    await controller.createReleaseNote(createReq({ body: { title: 'x', body: 'y', published: true } }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(201);
  });

  it('invalid release note create returns 400', async () => {
    supportAgreementService.createReleaseNote.rejects(new Error('title is required'));

    await controller.createReleaseNote(createReq({ body: {} }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(400);
  });

  it('PATCH release note returns updated note', async () => {
    supportAgreementService.updateReleaseNote.resolves({ id: 'rn-1', title: 'Updated' });

    await controller.updateReleaseNote(createReq({ param: () => 'rn-1', body: { title: 'Updated' } }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ id: 'rn-1', title: 'Updated' });
  });

  it('missing release note patch returns 404', async () => {
    supportAgreementService.updateReleaseNote.rejects(new Error('Release note not found'));

    await controller.updateReleaseNote(createReq({ param: () => 'rn-1', body: {} }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(404);
  });

  it('missing release note delete returns 404', async () => {
    supportAgreementService.deleteReleaseNote.rejects(new Error('Release note not found'));

    await controller.deleteReleaseNote(createReq({ param: () => 'rn-1' }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(404);
  });

  it('unexpected service error returns 500', async () => {
    supportAgreementService.getForBrand.rejects(new Error('boom'));

    await controller.getSettings(createReq(), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(500);
  });

  it('allows read requests for usernames outside the management allowlist', async () => {
    supportAgreementService.getForBrand.resolves({ supportYears: {}, releaseNotes: [] });

    await controller.getSettings(createReq({ user: { username: 'not-allowed' } }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(undefined);
    expect(supportAgreementService.getForBrand.calledOnce).to.equal(true);
  });

  it('returns 403 for forbidden mutation usernames and does not call the service', async () => {
    await controller.setYear(createReq({ user: { username: 'not-allowed' }, param: () => '2026' }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(403);
    expect(supportAgreementService.setYear.called).to.equal(false);
  });

  it('allows a configured extra username', async () => {
    clearSupportAgreementTestGlobals();
    installSupportAgreementTestGlobals({
      supportAgreement: {
        managementAllowedUsernames: ['admin', 'client-support']
      }
    });
    controller = new Controllers.SupportAgreement();
    sendRespStub = sinon.stub(controller, 'sendResp');
    getBrandFromReqStub = BrandingService.getBrandFromReq as SinonStub;
    getBrandFromReqStub.returns({ id: 'brand-1', name: 'default' });
    supportAgreementService = (globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice;
    supportAgreementService.getForBrand.resolves({ supportYears: {}, releaseNotes: [] });

    await controller.getSettings(createReq({ user: { username: 'client-support' } }), {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(undefined);
    expect(supportAgreementService.getForBrand.calledOnce).to.equal(true);
  });
});
