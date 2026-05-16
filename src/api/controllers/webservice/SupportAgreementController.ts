import { Controllers as controllers } from '@researchdatabox/redbox-core';

declare const BrandingService: {
  getBrandFromReq: (req: Sails.Req) => unknown;
};

declare const Supportagreementservice: {
  getForBrand: (brand: unknown) => Promise<{ supportYears?: Record<string, unknown>; releaseNotes?: unknown[] } | undefined>;
  setYear: (brand: unknown, year: unknown, data: Record<string, unknown>) => Promise<unknown>;
  deleteYear: (brand: unknown, year: unknown) => Promise<boolean>;
  listReleaseNotes: (brand: unknown, options?: { publishedOnly?: boolean }) => Promise<unknown[]>;
  createReleaseNote: (brand: unknown, input: Record<string, unknown>) => Promise<unknown>;
  updateReleaseNote: (brand: unknown, id: string, input: Record<string, unknown>) => Promise<unknown>;
  deleteReleaseNote: (brand: unknown, id: string) => Promise<boolean>;
};

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isNotFound(error: Error): boolean {
  return error.message === 'Release note not found';
}

export namespace Controllers {
  export class SupportAgreement extends controllers.Core.Controller {
    protected override _exportedMethods: string[] = [
      'getSettings',
      'listYears',
      'setYear',
      'deleteYear',
      'listReleaseNotes',
      'createReleaseNote',
      'updateReleaseNote',
      'deleteReleaseNote'
    ];

    protected getBrand(req: Sails.Req): unknown {
      return BrandingService.getBrandFromReq(req);
    }

    public async getSettings(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const settings = await Supportagreementservice.getForBrand(brand);
        return this.sendResp(req, res, {
          data: {
            supportYears: settings?.supportYears ?? {},
            releaseNotes: settings?.releaseNotes ?? []
          },
          headers: this.getNoCacheHeaders()
        });
      } catch (error) {
        return this.sendResp(req, res, { status: 500, errors: [asError(error)], headers: this.getNoCacheHeaders() });
      }
    }

    public async listYears(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const settings = await Supportagreementservice.getForBrand(brand);
        return this.sendResp(req, res, {
          data: settings?.supportYears ?? {},
          headers: this.getNoCacheHeaders()
        });
      } catch (error) {
        return this.sendResp(req, res, { status: 500, errors: [asError(error)], headers: this.getNoCacheHeaders() });
      }
    }

    public async setYear(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const saved = await Supportagreementservice.setYear(brand, req.param('year'), req.body as Record<string, unknown>);
        return this.sendResp(req, res, { data: saved, headers: this.getNoCacheHeaders() });
      } catch (error) {
        return this.sendResp(req, res, {
          status: 400,
          displayErrors: [{ detail: asError(error).message }],
          headers: this.getNoCacheHeaders()
        });
      }
    }

    public async deleteYear(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        await Supportagreementservice.deleteYear(brand, req.param('year'));
        return this.sendResp(req, res, { data: { status: true }, headers: this.getNoCacheHeaders() });
      } catch (error) {
        return this.sendResp(req, res, { status: 500, errors: [asError(error)], headers: this.getNoCacheHeaders() });
      }
    }

    public async listReleaseNotes(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const notes = await Supportagreementservice.listReleaseNotes(brand, {
          publishedOnly: req.param('publishedOnly') === 'true'
        });
        return this.sendResp(req, res, { data: notes, headers: this.getNoCacheHeaders() });
      } catch (error) {
        return this.sendResp(req, res, { status: 500, errors: [asError(error)], headers: this.getNoCacheHeaders() });
      }
    }

    public async createReleaseNote(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const created = await Supportagreementservice.createReleaseNote(brand, req.body as Record<string, unknown>);
        return this.sendResp(req, res, { status: 201, data: created, headers: this.getNoCacheHeaders() });
      } catch (error) {
        return this.sendResp(req, res, {
          status: 400,
          displayErrors: [{ detail: asError(error).message }],
          headers: this.getNoCacheHeaders()
        });
      }
    }

    public async updateReleaseNote(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        const updated = await Supportagreementservice.updateReleaseNote(brand, String(req.param('id') ?? ''), req.body as Record<string, unknown>);
        return this.sendResp(req, res, { data: updated, headers: this.getNoCacheHeaders() });
      } catch (error) {
        const resolvedError = asError(error);
        return this.sendResp(req, res, {
          status: isNotFound(resolvedError) ? 404 : 400,
          displayErrors: [{ detail: resolvedError.message }],
          headers: this.getNoCacheHeaders()
        });
      }
    }

    public async deleteReleaseNote(req: Sails.Req, res: Sails.Res): Promise<unknown> {
      try {
        const brand = this.getBrand(req);
        await Supportagreementservice.deleteReleaseNote(brand, String(req.param('id') ?? ''));
        return this.sendResp(req, res, { data: { status: true }, headers: this.getNoCacheHeaders() });
      } catch (error) {
        const resolvedError = asError(error);
        return this.sendResp(req, res, {
          status: isNotFound(resolvedError) ? 404 : 500,
          displayErrors: [{ detail: resolvedError.message }],
          headers: this.getNoCacheHeaders()
        });
      }
    }
  }
}
