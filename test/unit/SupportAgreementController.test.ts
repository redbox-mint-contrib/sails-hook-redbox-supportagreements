const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const sinon = require('sinon');
const {
  installSupportAgreementTestGlobals,
  clearSupportAgreementTestGlobals
} = require('../support/globals');
const { Controllers } = require('../../src/api/controllers/SupportAgreementController');
type SinonStub = ReturnType<typeof sinon.stub>;

describe('SupportAgreementController', () => {
  let controller: InstanceType<typeof Controllers.SupportAgreement>;
  let sendViewStub: SinonStub;
  let redirectStub: SinonStub;
  let getBrandFromReqStub: SinonStub;
  let getManagementViewModelStub: SinonStub;

  beforeEach(() => {
    installSupportAgreementTestGlobals();
    controller = new Controllers.SupportAgreement();
    sendViewStub = sinon.stub(controller, 'sendView');
    redirectStub = sinon.stub();
    getBrandFromReqStub = BrandingService.getBrandFromReq as SinonStub;
    getManagementViewModelStub = ((globalThis as unknown as Record<string, { getManagementViewModel: SinonStub }>).supportagreementservice).getManagementViewModel;
  });

  afterEach(() => {
    sinon.restore();
    clearSupportAgreementTestGlobals();
  });

  function createReq(overrides: Record<string, unknown> = {}): Sails.Req {
    return {
      user: { username: 'admin' },
      body: {},
      session: { branding: 'default' },
      query: {},
      param: (name: string) => ({ branding: 'default', portal: 'portal' }[name]),
      ...overrides
    } as unknown as Sails.Req;
  }

  function createRes(overrides: Record<string, unknown> = {}): Sails.Res {
    return {
      redirect: redirectStub,
      forbidden: sinon.stub(),
      status: sinon.stub().returnsThis(),
      send: sinon.stub(),
      ...overrides
    } as unknown as Sails.Res;
  }

  it('calls SupportAgreementService.getManagementViewModel and renders the page locals', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    getManagementViewModelStub.resolves({
      agreedSupportDays: 12,
      usedSupportDays: 4,
      selectedYear: 2025,
      availableYears: [2026, 2025],
      currentYear: 2026,
      releaseNotes: [{ id: 'rn-1', title: 'Release', renderedBody: 'Body' }]
    });

    await controller.index(createReq({ query: { year: '2025' } }), createRes());

    expect(getBrandFromReqStub.calledOnce).to.equal(true);
    expect(getManagementViewModelStub.calledOnceWithExactly(brand, 2025)).to.equal(true);
    expect(sendViewStub.calledOnce).to.equal(true);
    const [, , view, locals] = sendViewStub.firstCall.args;
    expect(view).to.equal('admin/supportAgreement');
    expect(locals).to.include({ branding: 'default', portal: 'portal' });
    expect(locals).to.include({ agreedSupportDays: 12, usedSupportDays: 4, selectedYear: 2025 });
    expect(locals.canManageSupportAgreements).to.equal(true);
    expect(locals.availableYears).to.deep.equal([2026, 2025]);
    expect(locals.releaseNotes).to.deep.equal([{ id: 'rn-1', title: 'Release', renderedBody: 'Body' }]);
  });

  it('falls back to session branding lookup when request brand resolver is unavailable', async () => {
    (BrandingService as unknown as Record<string, unknown>).getBrandFromReq = undefined;
    const getBrandStub = BrandingService.getBrand as SinonStub;
    getBrandStub.returns({ id: 'brand-1', name: 'default' });
    getManagementViewModelStub.resolves({
      agreedSupportDays: 20,
      usedSupportDays: 8,
      selectedYear: 2025,
      availableYears: [2025, 2024],
      currentYear: 2025,
      releaseNotes: []
    });

    await controller.index(createReq({ query: { year: '2025' } }), createRes());

    expect(getBrandStub.calledOnceWithExactly('default')).to.equal(true);
    expect(getManagementViewModelStub.calledOnce).to.equal(true);
  });

  it('defaults invalid year query values to the current year before calling the service', async () => {
    const currentYear = new Date().getFullYear();
    getBrandFromReqStub.returns({ id: 'brand-1', name: 'default' });
    getManagementViewModelStub.resolves({
      agreedSupportDays: 0,
      usedSupportDays: 0,
      selectedYear: currentYear,
      availableYears: [currentYear],
      currentYear,
      releaseNotes: []
    });

    await controller.index(createReq({ query: { year: 'abc' } }), createRes());

    expect(getManagementViewModelStub.calledOnceWithExactly(sinon.match.object, currentYear)).to.equal(true);
  });

  it('renders index in read-only mode for users outside the management allowlist', async () => {
    getBrandFromReqStub.returns({ id: 'brand-1', name: 'default' });
    getManagementViewModelStub.resolves({
      agreedSupportDays: 12,
      usedSupportDays: 4,
      selectedYear: 2025,
      availableYears: [2025],
      currentYear: 2026,
      releaseNotes: []
    });

    await controller.index(createReq({ user: { username: 'not-allowed' }, query: { year: '2025' } }), createRes());

    expect(sendViewStub.calledOnce).to.equal(true);
    expect(getManagementViewModelStub.calledOnce).to.equal(true);
    const locals = sendViewStub.firstCall.args[3];
    expect(locals.canManageSupportAgreements).to.equal(false);
  });

  it('saveYear calls the service and redirects back to the selected year', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    const setYearStub = ((globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice).setYear;

    await controller.saveYear(createReq({
      body: { year: '2026', agreedSupportDays: '12', usedSupportDays: '4' }
    }), createRes());

    expect(setYearStub.calledOnceWithExactly(brand, '2026', { agreedSupportDays: '12', usedSupportDays: '4' })).to.equal(true);
    expect(redirectStub.calledOnceWithExactly('/default/portal/admin/supportAgreement?year=2026')).to.equal(true);
  });

  it('deleteYear denies forbidden requests without calling the service', async () => {
    const deleteYearStub = ((globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice).deleteYear;
    const res = createRes();

    await controller.deleteYear(createReq({ user: { username: 'not-allowed' }, body: { year: '2026' } }), res);

    expect((res.forbidden as SinonStub).calledOnce).to.equal(true);
    expect(deleteYearStub.called).to.equal(false);
  });

  it('createReleaseNote normalizes the published checkbox to boolean', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    const createReleaseNoteStub = ((globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice).createReleaseNote;

    await controller.createReleaseNote(createReq({
      body: { year: '2026', title: 'Title', body: 'Body', releaseDate: '2026-05-16', published: 'on' }
    }), createRes());

    expect(createReleaseNoteStub.calledOnceWithExactly(brand, {
      title: 'Title',
      body: 'Body',
      releaseDate: '2026-05-16',
      published: true
    })).to.equal(true);
  });

  it('updateReleaseNote calls the service with the supplied id', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    const updateReleaseNoteStub = ((globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice).updateReleaseNote;

    await controller.updateReleaseNote(createReq({
      body: { year: '2026', id: 'rn-1', title: 'Title', body: 'Body', releaseDate: '2026-05-16' }
    }), createRes());

    expect(updateReleaseNoteStub.calledOnceWithExactly(brand, 'rn-1', {
      title: 'Title',
      body: 'Body',
      releaseDate: '2026-05-16',
      published: false
    })).to.equal(true);
  });

  it('deleteReleaseNote calls the service and redirects', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    const deleteReleaseNoteStub = ((globalThis as unknown as Record<string, Record<string, SinonStub>>).supportagreementservice).deleteReleaseNote;

    await controller.deleteReleaseNote(createReq({
      body: { year: '2026', id: 'rn-1' }
    }), createRes());

    expect(deleteReleaseNoteStub.calledOnceWithExactly(brand, 'rn-1')).to.equal(true);
    expect(redirectStub.calledOnceWithExactly('/default/portal/admin/supportAgreement?year=2026')).to.equal(true);
  });
});
