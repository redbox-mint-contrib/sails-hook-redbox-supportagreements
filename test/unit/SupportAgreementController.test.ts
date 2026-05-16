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
  let getBrandFromReqStub: SinonStub;
  let getViewModelStub: SinonStub;

  beforeEach(() => {
    installSupportAgreementTestGlobals();
    controller = new Controllers.SupportAgreement();
    sendViewStub = sinon.stub(controller, 'sendView');
    getBrandFromReqStub = BrandingService.getBrandFromReq as SinonStub;
    getViewModelStub = ((globalThis as unknown as Record<string, { getViewModel: SinonStub }>).supportagreementservice).getViewModel;
  });

  afterEach(() => {
    sinon.restore();
    clearSupportAgreementTestGlobals();
  });

  it('calls SupportAgreementService.getViewModel and renders the page locals', async () => {
    const brand = { id: 'brand-1', name: 'default' };
    getBrandFromReqStub.returns(brand);
    getViewModelStub.resolves({
      agreedSupportDays: 12,
      usedSupportDays: 4,
      selectedYear: 2025,
      availableYears: [2026, 2025],
      currentYear: 2026,
      releaseNotes: [{ id: 'rn-1', title: 'Release', renderedBody: 'Body' }]
    });

    await controller.index({
      session: { branding: 'default' },
      query: { year: '2025' }
    } as unknown as Sails.Req, {} as Sails.Res);

    expect(getBrandFromReqStub.calledOnce).to.equal(true);
    expect(getViewModelStub.calledOnceWithExactly(brand, 2025)).to.equal(true);
    expect(sendViewStub.calledOnce).to.equal(true);
    const [, , view, locals] = sendViewStub.firstCall.args;
    expect(view).to.equal('admin/supportAgreement');
    expect(locals).to.include({ agreedSupportDays: 12, usedSupportDays: 4, selectedYear: 2025 });
    expect(locals.availableYears).to.deep.equal([2026, 2025]);
    expect(locals.releaseNotes).to.deep.equal([{ id: 'rn-1', title: 'Release', renderedBody: 'Body' }]);
  });

  it('falls back to session branding lookup when request brand resolver is unavailable', async () => {
    (BrandingService as unknown as Record<string, unknown>).getBrandFromReq = undefined;
    const getBrandStub = BrandingService.getBrand as SinonStub;
    getBrandStub.returns({ id: 'brand-1', name: 'default' });
    getViewModelStub.resolves({
      agreedSupportDays: 20,
      usedSupportDays: 8,
      selectedYear: 2025,
      availableYears: [2025, 2024],
      currentYear: 2025,
      releaseNotes: []
    });

    await controller.index({
      session: { branding: 'default' },
      query: { year: '2025' }
    } as unknown as Sails.Req, {} as Sails.Res);

    expect(getBrandStub.calledOnceWithExactly('default')).to.equal(true);
    expect(getViewModelStub.calledOnce).to.equal(true);
  });

  it('defaults invalid year query values to the current year before calling the service', async () => {
    const currentYear = new Date().getFullYear();
    getBrandFromReqStub.returns({ id: 'brand-1', name: 'default' });
    getViewModelStub.resolves({
      agreedSupportDays: 0,
      usedSupportDays: 0,
      selectedYear: currentYear,
      availableYears: [currentYear],
      currentYear,
      releaseNotes: []
    });

    await controller.index({
      session: { branding: 'default' },
      query: { year: 'abc' }
    } as unknown as Sails.Req, {} as Sails.Res);

    expect(getViewModelStub.calledOnceWithExactly(sinon.match.object, currentYear)).to.equal(true);
  });
});
