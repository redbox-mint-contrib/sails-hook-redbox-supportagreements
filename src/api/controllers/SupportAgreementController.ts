import { Controllers as controllers } from '@researchdatabox/redbox-core';
import { canManageSupportAgreements } from './supportAgreementAccess';

declare const BrandingService: {
  getBrand: (branding: string) => BrandLike;
  getBrandFromReq?: (req: Sails.Req) => BrandLike;
};

declare const supportagreementservice: {
  getManagementViewModel: (brand: BrandLike, selectedYear: number | undefined) => Promise<{
    agreedSupportDays: number;
    usedSupportDays: number;
    selectedYear: number;
    availableYears: number[];
    currentYear: number;
    releaseNotes: Array<Record<string, unknown>>;
  }>;
  setYear: (brand: BrandLike, year: unknown, data: Record<string, unknown>) => Promise<unknown>;
  deleteYear: (brand: BrandLike, year: unknown) => Promise<boolean>;
  createReleaseNote: (brand: BrandLike, input: Record<string, unknown>) => Promise<unknown>;
  updateReleaseNote: (brand: BrandLike, id: string, input: Record<string, unknown>) => Promise<unknown>;
  deleteReleaseNote: (brand: BrandLike, id: string) => Promise<boolean>;
};

type BrandLike = {
  id?: string | number;
  name?: string;
};

export namespace Controllers {
  export class SupportAgreement extends controllers.Core.Controller {
    protected override _exportedMethods: string[] = [
      'index',
      'saveYear',
      'deleteYear',
      'createReleaseNote',
      'updateReleaseNote',
      'deleteReleaseNote'
    ];

    protected getBrand(req: Sails.Req): BrandLike {
      return typeof BrandingService.getBrandFromReq === 'function'
        ? BrandingService.getBrandFromReq(req)
        : BrandingService.getBrand(req.session.branding as string);
    }

    protected deny(req: Sails.Req, res: Sails.Res): void {
      if (typeof res.forbidden === 'function') {
        res.forbidden();
        return;
      }

      res.status(403);
      res.send('Forbidden');
    }

    protected normalizePublished(value: unknown): boolean {
      return value === true || value === 'true' || value === 'on' || value === '1' || value === 1;
    }

    protected redirectToIndex(req: Sails.Req, res: Sails.Res, year?: unknown): void {
      const branding = req.param('branding');
      const portal = req.param('portal');
      const queryString = typeof year === 'undefined' || year === null || year === '' ? '' : `?year=${encodeURIComponent(String(year))}`;
      res.redirect(`/${branding}/${portal}/admin/supportAgreement${queryString}`);
    }

    public async index(req: Sails.Req, res: Sails.Res): Promise<void> {
      const fallbackYear = new Date().getFullYear();
      const selectedYear = Number.parseInt(String(req.query.year ?? ''), 10);
      const resolvedSelectedYear = Number.isFinite(selectedYear) ? selectedYear : fallbackYear;
      const brand = this.getBrand(req);
      const viewModel = await supportagreementservice.getManagementViewModel(brand, resolvedSelectedYear);

      this.sendView(req, res, 'admin/supportAgreement', {
        branding: req.param('branding'),
        portal: req.param('portal'),
        agreedSupportDays: viewModel.agreedSupportDays,
        usedSupportDays: viewModel.usedSupportDays,
        selectedYear: viewModel.selectedYear,
        availableYears: viewModel.availableYears,
        currentYear: viewModel.currentYear,
        releaseNotes: viewModel.releaseNotes,
        canManageSupportAgreements: canManageSupportAgreements(req)
      });
    }

    public async saveYear(req: Sails.Req, res: Sails.Res): Promise<void> {
      if (!canManageSupportAgreements(req)) {
        this.deny(req, res);
        return;
      }

      const brand = this.getBrand(req);
      const year = req.body.year;
      await supportagreementservice.setYear(brand, year, {
        agreedSupportDays: req.body.agreedSupportDays,
        usedSupportDays: req.body.usedSupportDays
      });
      this.redirectToIndex(req, res, year);
    }

    public async deleteYear(req: Sails.Req, res: Sails.Res): Promise<void> {
      if (!canManageSupportAgreements(req)) {
        this.deny(req, res);
        return;
      }

      const brand = this.getBrand(req);
      const year = req.body.year;
      await supportagreementservice.deleteYear(brand, year);
      this.redirectToIndex(req, res);
    }

    public async createReleaseNote(req: Sails.Req, res: Sails.Res): Promise<void> {
      if (!canManageSupportAgreements(req)) {
        this.deny(req, res);
        return;
      }

      const brand = this.getBrand(req);
      await supportagreementservice.createReleaseNote(brand, {
        title: req.body.title,
        body: req.body.body,
        releaseDate: req.body.releaseDate,
        published: this.normalizePublished(req.body.published)
      });
      this.redirectToIndex(req, res, req.body.year);
    }

    public async updateReleaseNote(req: Sails.Req, res: Sails.Res): Promise<void> {
      if (!canManageSupportAgreements(req)) {
        this.deny(req, res);
        return;
      }

      const brand = this.getBrand(req);
      await supportagreementservice.updateReleaseNote(brand, String(req.body.id ?? ''), {
        title: req.body.title,
        body: req.body.body,
        releaseDate: req.body.releaseDate,
        published: this.normalizePublished(req.body.published)
      });
      this.redirectToIndex(req, res, req.body.year);
    }

    public async deleteReleaseNote(req: Sails.Req, res: Sails.Res): Promise<void> {
      if (!canManageSupportAgreements(req)) {
        this.deny(req, res);
        return;
      }

      const brand = this.getBrand(req);
      await supportagreementservice.deleteReleaseNote(brand, String(req.body.id ?? ''));
      this.redirectToIndex(req, res, req.body.year);
    }
  }
}
