const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const sinon = require('sinon');
const {
  installSupportAgreementTestGlobals,
  clearSupportAgreementTestGlobals
} = require('../support/globals');
const { Services } = require('../../src/api/services/SupportAgreementService');

type SinonStub = ReturnType<typeof sinon.stub>;

describe('SupportAgreementService', () => {
  let service: InstanceType<typeof Services.SupportAgreement>;
  let getBrandStub: SinonStub;
  let findOneStub: SinonStub;
  let createStub: SinonStub;
  let updateOneStub: SinonStub;

  beforeEach(() => {
    installSupportAgreementTestGlobals();
    service = new Services.SupportAgreement();
    getBrandStub = BrandingService.getBrand as SinonStub;
    findOneStub = SupportAgreement.findOne as SinonStub;
    createStub = SupportAgreement.create as SinonStub;
    updateOneStub = SupportAgreement.updateOne as SinonStub;
    getBrandStub.callsFake((name: string) => ({ id: `brand-${name}`, name }));
    updateOneStub.callsFake(({ id }: { id: string }) => ({
      set: sinon.stub().resolvesArg(0).callsFake((payload: Record<string, unknown>) => ({ id, ...payload }))
    }));
  });

  afterEach(() => {
    sinon.restore();
    clearSupportAgreementTestGlobals();
  });

  it('getOrCreateForBrand creates a new document when none exists', async () => {
    findOneStub.resolves(undefined);
    const fetchStub = sinon.stub().resolves({ id: 'sa-1', branding: 'brand-default', supportYears: {}, releaseNotes: [] });
    createStub.returns({ fetch: fetchStub });

    const result = await service.getOrCreateForBrand('default');

    expect(createStub.calledOnceWithExactly({ branding: 'brand-default', supportYears: {}, releaseNotes: [] })).to.equal(true);
    expect(result.id).to.equal('sa-1');
  });

  it('getForBrand returns an existing document', async () => {
    findOneStub.resolves({ id: 'sa-1', branding: 'brand-default', supportYears: { 2026: { agreedSupportDays: 10, usedSupportDays: 1 } }, releaseNotes: [] });

    const result = await service.getForBrand('default');

    expect(result).to.include({ id: 'sa-1', branding: 'brand-default' });
  });

  it('setYear validates year and saves support days', async () => {
    findOneStub.onFirstCall().resolves({ id: 'sa-1', branding: 'brand-default', supportYears: {}, releaseNotes: [] });

    const result = await service.setYear('default', '2026', { agreedSupportDays: 20, usedSupportDays: 4 });

    expect(result).to.deep.equal({ agreedSupportDays: 20, usedSupportDays: 4 });
    expect(updateOneStub.calledOnce).to.equal(true);
  });

  it('setYear rejects invalid year values', async () => {
    try {
      await service.setYear('default', 'abc', { agreedSupportDays: 20, usedSupportDays: 4 });
      expect.fail('Expected setYear to reject invalid year values');
    } catch (error: unknown) {
      expect((error as Error).message).to.equal('Year must be a finite integer');
    }
  });

  it('setYear rejects negative support-day values', async () => {
    findOneStub.resolves({ id: 'sa-1', branding: 'brand-default', supportYears: {}, releaseNotes: [] });

    try {
      await service.setYear('default', 2026, { agreedSupportDays: -1, usedSupportDays: 4 });
      expect.fail('Expected setYear to reject negative support days');
    } catch (error: unknown) {
      expect((error as Error).message).to.equal('agreedSupportDays must be a non-negative number');
    }
  });

  it('deleteYear removes only the requested year', async () => {
    findOneStub.resolves({
      id: 'sa-1',
      branding: 'brand-default',
      supportYears: {
        2025: { agreedSupportDays: 10, usedSupportDays: 1 },
        2026: { agreedSupportDays: 12, usedSupportDays: 2 }
      },
      releaseNotes: []
    });

    await service.deleteYear('default', 2025);

    const updateCall = updateOneStub.firstCall.returnValue.set;
    expect(updateCall.calledOnce).to.equal(true);
    expect(updateCall.firstCall.args[0].supportYears).to.deep.equal({ 2026: { agreedSupportDays: 12, usedSupportDays: 2 } });
  });

  it('getViewModel includes current year in availableYears', async () => {
    const currentYear = new Date().getFullYear();
    findOneStub.resolves({ id: 'sa-1', branding: 'brand-default', supportYears: { 2020: { agreedSupportDays: 8, usedSupportDays: 2 } }, releaseNotes: [] });

    const result = await service.getViewModel('default', 2020);

    expect(result.availableYears).to.include(currentYear);
    expect(result.selectedYear).to.equal(2020);
  });

  it('createReleaseNote assigns id, createdAt, and updatedAt', async () => {
    findOneStub.resolves({ id: 'sa-1', branding: 'brand-default', supportYears: {}, releaseNotes: [] });

    const result = await service.createReleaseNote('default', {
      title: 'Release title',
      body: 'Markdown body',
      releaseDate: '2026-05-16',
      published: true
    });

    expect(result.id).to.be.a('string');
    expect(result.createdAt).to.be.a('string');
    expect(result.updatedAt).to.equal(result.createdAt);
  });

  it('updateReleaseNote changes only supplied fields and refreshes updatedAt', async () => {
    findOneStub.resolves({
      id: 'sa-1',
      branding: 'brand-default',
      supportYears: {},
      releaseNotes: [{
        id: 'rn-1',
        title: 'Old',
        body: 'Body',
        releaseDate: '2026-05-16',
        published: true,
        createdAt: '2026-05-16T01:30:00.000Z',
        updatedAt: '2026-05-16T01:30:00.000Z'
      }]
    });

    const result = await service.updateReleaseNote('default', 'rn-1', { title: 'New' });

    expect(result.title).to.equal('New');
    expect(result.body).to.equal('Body');
    expect(result.updatedAt).to.not.equal('2026-05-16T01:30:00.000Z');
  });

  it('deleteReleaseNote removes a note by id', async () => {
    findOneStub.resolves({
      id: 'sa-1',
      branding: 'brand-default',
      supportYears: {},
      releaseNotes: [{
        id: 'rn-1',
        title: 'Old',
        body: 'Body',
        published: true,
        createdAt: '2026-05-16T01:30:00.000Z',
        updatedAt: '2026-05-16T01:30:00.000Z'
      }]
    });

    const result = await service.deleteReleaseNote('default', 'rn-1');

    expect(result).to.equal(true);
  });

  it('listReleaseNotes with publishedOnly excludes unpublished notes', async () => {
    findOneStub.resolves({
      id: 'sa-1',
      branding: 'brand-default',
      supportYears: {},
      releaseNotes: [
        { id: 'rn-1', title: 'Published', body: '', published: true, createdAt: '2026-05-16T01:30:00.000Z', updatedAt: '2026-05-16T01:30:00.000Z' },
        { id: 'rn-2', title: 'Draft', body: '', published: false, createdAt: '2026-05-17T01:30:00.000Z', updatedAt: '2026-05-17T01:30:00.000Z' }
      ]
    });

    const result = await service.listReleaseNotes('default', { publishedOnly: true });

    expect(result.map((note: { id: string }) => note.id)).to.deep.equal(['rn-1']);
  });

  it('sorts release notes newest first', async () => {
    findOneStub.resolves({
      id: 'sa-1',
      branding: 'brand-default',
      supportYears: {},
      releaseNotes: [
        { id: 'rn-1', title: 'Older', body: '', releaseDate: '2026-05-16', published: true, createdAt: '2026-05-16T01:30:00.000Z', updatedAt: '2026-05-16T01:30:00.000Z' },
        { id: 'rn-2', title: 'Newer', body: '', releaseDate: '2026-05-17', published: true, createdAt: '2026-05-15T01:30:00.000Z', updatedAt: '2026-05-15T01:30:00.000Z' }
      ]
    });

    const result = await service.listReleaseNotes('default');

    expect(result.map((note: { id: string }) => note.id)).to.deep.equal(['rn-2', 'rn-1']);
  });
});
