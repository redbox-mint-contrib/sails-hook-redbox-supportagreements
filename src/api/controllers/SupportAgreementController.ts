import { Controllers as controllers } from '@researchdatabox/redbox-core';

declare const BrandingService: {
  getBrand: (branding: string) => BrandLike;
  getBrandFromReq?: (req: Sails.Req) => BrandLike;
};

declare const supportagreementservice: {
  getViewModel: (brand: BrandLike, selectedYear: number | undefined) => Promise<{
    agreedSupportDays: number;
    usedSupportDays: number;
    selectedYear: number;
    availableYears: number[];
    currentYear: number;
    releaseNotes: Array<Record<string, unknown>>;
  }>;
};

type BrandLike = {
  id?: string | number;
  name?: string;
};

export namespace Controllers {
  export class SupportAgreement extends controllers.Core.Controller {
    protected override _exportedMethods: string[] = ['index'];

    public async index(req: Sails.Req, res: Sails.Res): Promise<void> {
      const fallbackYear = new Date().getFullYear();
      const selectedYear = Number.parseInt(String(req.query.year ?? ''), 10);
      const resolvedSelectedYear = Number.isFinite(selectedYear) ? selectedYear : fallbackYear;
      const brand = typeof BrandingService.getBrandFromReq === 'function'
        ? BrandingService.getBrandFromReq(req)
        : BrandingService.getBrand(req.session.branding as string);
      const viewModel = await supportagreementservice.getViewModel(brand, resolvedSelectedYear);

      this.sendView(req, res, 'admin/supportAgreement', {
        agreedSupportDays: viewModel.agreedSupportDays,
        usedSupportDays: viewModel.usedSupportDays,
        selectedYear: viewModel.selectedYear,
        availableYears: viewModel.availableYears,
        currentYear: viewModel.currentYear,
        releaseNotes: viewModel.releaseNotes
      });
    }
  }
}
