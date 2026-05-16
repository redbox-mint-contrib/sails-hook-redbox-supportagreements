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

  it('GET settings returns support years and release notes', async () => {
    supportAgreementService.getForBrand.resolves({ supportYears: { 2026: { agreedSupportDays: 20, usedSupportDays: 4 } }, releaseNotes: [] });

    await controller.getSettings({} as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ supportYears: { 2026: { agreedSupportDays: 20, usedSupportDays: 4 } }, releaseNotes: [] });
  });

  it('PUT years returns saved data', async () => {
    supportAgreementService.setYear.resolves({ agreedSupportDays: 20, usedSupportDays: 4 });

    await controller.setYear({ param: () => '2026', body: { agreedSupportDays: 20, usedSupportDays: 4 } } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ agreedSupportDays: 20, usedSupportDays: 4 });
  });

  it('invalid year update returns 400', async () => {
    supportAgreementService.setYear.rejects(new Error('Year must be a finite integer'));

    await controller.setYear({ param: () => 'bad', body: {} } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(400);
  });

  it('DELETE year returns status true', async () => {
    supportAgreementService.deleteYear.resolves(true);

    await controller.deleteYear({ param: () => '2026' } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ status: true });
  });

  it('GET release notes returns notes', async () => {
    supportAgreementService.listReleaseNotes.resolves([{ id: 'rn-1' }]);

    await controller.listReleaseNotes({ param: () => undefined } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal([{ id: 'rn-1' }]);
  });

  it('POST release notes returns 201', async () => {
    supportAgreementService.createReleaseNote.resolves({ id: 'rn-1' });

    await controller.createReleaseNote({ body: { title: 'x', body: 'y', published: true } } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(201);
  });

  it('invalid release note create returns 400', async () => {
    supportAgreementService.createReleaseNote.rejects(new Error('title is required'));

    await controller.createReleaseNote({ body: {} } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(400);
  });

  it('PATCH release note returns updated note', async () => {
    supportAgreementService.updateReleaseNote.resolves({ id: 'rn-1', title: 'Updated' });

    await controller.updateReleaseNote({ param: () => 'rn-1', body: { title: 'Updated' } } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].data).to.deep.equal({ id: 'rn-1', title: 'Updated' });
  });

  it('missing release note patch returns 404', async () => {
    supportAgreementService.updateReleaseNote.rejects(new Error('Release note not found'));

    await controller.updateReleaseNote({ param: () => 'rn-1', body: {} } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(404);
  });

  it('missing release note delete returns 404', async () => {
    supportAgreementService.deleteReleaseNote.rejects(new Error('Release note not found'));

    await controller.deleteReleaseNote({ param: () => 'rn-1' } as unknown as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(404);
  });

  it('unexpected service error returns 500', async () => {
    supportAgreementService.getForBrand.rejects(new Error('boom'));

    await controller.getSettings({} as Sails.Req, {} as Sails.Res);

    expect(sendRespStub.firstCall.args[2].status).to.equal(500);
  });
});
