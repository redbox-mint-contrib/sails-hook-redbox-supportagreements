import { Services as services, type BrandingModel } from '@researchdatabox/redbox-core';
import type { ReleaseNote, SupportAgreementAttributes, SupportAgreementYear } from '../models/SupportAgreement';

type BrandIdentifier = BrandingModel | string;

type SupportAgreementRecord = SupportAgreementAttributes & {
  id?: string | number;
};

type MutableReleaseNoteInput = {
  title?: unknown;
  body?: unknown;
  releaseDate?: unknown;
  published?: unknown;
};

type ViewReleaseNote = ReleaseNote & {
  renderedBody: string;
};

export type SupportAgreementViewModel = {
  agreedSupportDays: number;
  usedSupportDays: number;
  selectedYear: number;
  availableYears: number[];
  currentYear: number;
  releaseNotes: ViewReleaseNote[];
};

declare const BrandingService: {
  getBrand: (branding: string) => BrandingModel;
};

type SupportAgreementModelApi = {
  findOne: (criteria: Record<string, unknown>) => Promise<SupportAgreementRecord | undefined>;
  create: (values: Record<string, unknown>) => { fetch: () => Promise<SupportAgreementRecord> };
  updateOne: (criteria: Record<string, unknown>) => { set: (values: Record<string, unknown>) => Promise<SupportAgreementRecord | undefined> };
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return undefined;
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function parseYearValue(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error('Year must be a finite integer');
  }

  return parsed;
}

function normalizeYearKey(value: unknown): string {
  return String(parseYearValue(value));
}

function normalizeSupportDays(value: unknown, fieldName: string): number {
  const parsed = typeof value === 'number' ? value : Number(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }

  return parsed;
}

function compareReleaseNotes(a: ReleaseNote, b: ReleaseNote): number {
  const dateA = a.releaseDate ?? a.createdAt;
  const dateB = b.releaseDate ?? b.createdAt;
  const primary = Date.parse(dateB) - Date.parse(dateA);
  if (primary !== 0) {
    return primary;
  }

  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

function sortReleaseNotes(notes: ReleaseNote[]): ReleaseNote[] {
  return [...notes].sort(compareReleaseNotes);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderReleaseNoteBody(body: string): string {
  return escapeHtml(body).replace(/\r?\n/g, '<br>');
}

function createTimestamp(): string {
  return new Date().toISOString();
}

function createId(): string {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (typeof cryptoObject?.randomUUID === 'function') {
    return cryptoObject.randomUUID();
  }

  return `rn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSupportAgreementModel(): SupportAgreementModelApi {
  return (globalThis as unknown as { SupportAgreement: SupportAgreementModelApi }).SupportAgreement;
}

export namespace Services {
  export class SupportAgreement extends services.Core.Service {
    protected override _exportedMethods: string[] = [
      'getForBrand',
      'getOrCreateForBrand',
      'getYear',
      'setYear',
      'deleteYear',
      'listReleaseNotes',
      'getReleaseNote',
      'createReleaseNote',
      'updateReleaseNote',
      'deleteReleaseNote',
      'getViewModel'
    ];

    protected resolveBrand(brand: BrandIdentifier): BrandingModel {
      return typeof brand === 'string' ? BrandingService.getBrand(brand) : brand;
    }

    protected resolveBrandId(brand: BrandIdentifier): string | number {
      const resolvedBrand = this.resolveBrand(brand) as BrandingModel & { id?: string | number; name?: string };
      if (typeof resolvedBrand.id !== 'undefined' && resolvedBrand.id !== null && resolvedBrand.id !== '') {
        return resolvedBrand.id;
      }

      if (typeof resolvedBrand.name === 'string' && resolvedBrand.name.trim()) {
        return resolvedBrand.name;
      }

      throw new Error('Brand id could not be resolved');
    }

    protected normalizeRecord(record: SupportAgreementRecord | undefined | null): SupportAgreementRecord | undefined {
      if (!record) {
        return undefined;
      }

      return {
        ...record,
        supportYears: record.supportYears ?? {},
        releaseNotes: sortReleaseNotes(record.releaseNotes ?? [])
      };
    }

    protected async saveRecord(record: SupportAgreementRecord): Promise<SupportAgreementRecord> {
      const payload = {
        supportYears: record.supportYears ?? {},
        releaseNotes: sortReleaseNotes(record.releaseNotes ?? [])
      };

      const id = record.id;
      if (typeof id === 'undefined' || id === null || id === '') {
        throw new Error('Cannot save support agreement without id');
      }

      const updated = await getSupportAgreementModel().updateOne({ id }).set(payload);
      return this.normalizeRecord((updated ?? { ...record, ...payload }) as SupportAgreementRecord) as SupportAgreementRecord;
    }

    public async getForBrand(brand: BrandIdentifier): Promise<SupportAgreementRecord | undefined> {
      const branding = this.resolveBrandId(brand);
      const record = await getSupportAgreementModel().findOne({ branding });
      return this.normalizeRecord(record as SupportAgreementRecord | undefined);
    }

    public async getOrCreateForBrand(brand: BrandIdentifier): Promise<SupportAgreementRecord> {
      const existing = await this.getForBrand(brand);
      if (existing) {
        return existing;
      }

      const branding = this.resolveBrandId(brand);
      const created = await getSupportAgreementModel().create({
        branding,
        supportYears: {},
        releaseNotes: []
      }).fetch();

      return this.normalizeRecord(created as SupportAgreementRecord) as SupportAgreementRecord;
    }

    public async getYear(brand: BrandIdentifier, year: unknown): Promise<SupportAgreementYear | undefined> {
      const record = await this.getForBrand(brand);
      if (!record) {
        return undefined;
      }

      return record.supportYears?.[normalizeYearKey(year)];
    }

    public async setYear(brand: BrandIdentifier, year: unknown, data: Partial<SupportAgreementYear>): Promise<SupportAgreementYear> {
      const yearKey = normalizeYearKey(year);
      const record = await this.getOrCreateForBrand(brand);
      const normalized: SupportAgreementYear = {
        agreedSupportDays: normalizeSupportDays(data.agreedSupportDays, 'agreedSupportDays'),
        usedSupportDays: normalizeSupportDays(data.usedSupportDays, 'usedSupportDays')
      };

      record.supportYears = {
        ...(record.supportYears ?? {}),
        [yearKey]: normalized
      };
      await this.saveRecord(record);
      return normalized;
    }

    public async deleteYear(brand: BrandIdentifier, year: unknown): Promise<boolean> {
      const record = await this.getForBrand(brand);
      if (!record) {
        return true;
      }

      const yearKey = normalizeYearKey(year);
      const supportYears = { ...(record.supportYears ?? {}) };
      delete supportYears[yearKey];
      record.supportYears = supportYears;
      await this.saveRecord(record);
      return true;
    }

    public async listReleaseNotes(brand: BrandIdentifier, options: { publishedOnly?: boolean } = {}): Promise<ReleaseNote[]> {
      const record = await this.getForBrand(brand);
      const releaseNotes = sortReleaseNotes(record?.releaseNotes ?? []);
      if (options.publishedOnly) {
        return releaseNotes.filter(note => note.published);
      }

      return releaseNotes;
    }

    public async getReleaseNote(brand: BrandIdentifier, id: string): Promise<ReleaseNote | undefined> {
      const notes = await this.listReleaseNotes(brand);
      return notes.find(note => note.id === id);
    }

    protected validateReleaseNoteInput(input: MutableReleaseNoteInput, requireAllFields: boolean): {
      title?: string;
      body?: string;
      releaseDate?: string;
      published?: boolean;
    } {
      const normalized: {
        title?: string;
        body?: string;
        releaseDate?: string;
        published?: boolean;
      } = {};

      if (requireAllFields || Object.prototype.hasOwnProperty.call(input, 'title')) {
        if (typeof input.title !== 'string' || !input.title.trim()) {
          throw new Error('title is required');
        }

        normalized.title = input.title.trim();
      }

      if (requireAllFields || Object.prototype.hasOwnProperty.call(input, 'body')) {
        if (typeof input.body !== 'string') {
          throw new Error('body is required');
        }

        normalized.body = input.body;
      }

      if (Object.prototype.hasOwnProperty.call(input, 'releaseDate')) {
        if (typeof input.releaseDate !== 'string' || !input.releaseDate.trim()) {
          normalized.releaseDate = undefined;
        } else {
          normalized.releaseDate = input.releaseDate;
        }
      }

      if (requireAllFields || Object.prototype.hasOwnProperty.call(input, 'published')) {
        if (typeof input.published !== 'boolean') {
          throw new Error('published must be a boolean');
        }

        normalized.published = input.published;
      }

      return normalized;
    }

    public async createReleaseNote(brand: BrandIdentifier, input: MutableReleaseNoteInput): Promise<ReleaseNote> {
      const record = await this.getOrCreateForBrand(brand);
      const normalized = this.validateReleaseNoteInput(input, true);
      const timestamp = createTimestamp();
      const note: ReleaseNote = {
        id: createId(),
        title: normalized.title as string,
        body: normalized.body as string,
        releaseDate: normalized.releaseDate,
        published: normalized.published as boolean,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      record.releaseNotes = sortReleaseNotes([...(record.releaseNotes ?? []), note]);
      await this.saveRecord(record);
      return note;
    }

    public async updateReleaseNote(brand: BrandIdentifier, id: string, input: MutableReleaseNoteInput): Promise<ReleaseNote> {
      const record = await this.getOrCreateForBrand(brand);
      const notes = [...(record.releaseNotes ?? [])];
      const index = notes.findIndex(note => note.id === id);
      if (index === -1) {
        throw new Error('Release note not found');
      }

      const normalized = this.validateReleaseNoteInput(input, false);
      const updatedNote: ReleaseNote = {
        ...notes[index],
        ...normalized,
        updatedAt: createTimestamp()
      };

      notes[index] = updatedNote;
      record.releaseNotes = sortReleaseNotes(notes);
      await this.saveRecord(record);
      return updatedNote;
    }

    public async deleteReleaseNote(brand: BrandIdentifier, id: string): Promise<boolean> {
      const record = await this.getForBrand(brand);
      if (!record) {
        throw new Error('Release note not found');
      }

      const notes = record.releaseNotes ?? [];
      const nextNotes = notes.filter(note => note.id !== id);
      if (nextNotes.length === notes.length) {
        throw new Error('Release note not found');
      }

      record.releaseNotes = nextNotes;
      await this.saveRecord(record);
      return true;
    }

    public async getViewModel(brand: BrandIdentifier, selectedYear?: unknown): Promise<SupportAgreementViewModel> {
      try {
        const currentYear = getCurrentYear();
        const resolvedSelectedYear = typeof selectedYear === 'undefined' || selectedYear === null || selectedYear === ''
          ? currentYear
          : parseYearValue(selectedYear);
        const record = await this.getForBrand(brand);
        const supportYears = record?.supportYears ?? {};
        const yearData = supportYears[String(resolvedSelectedYear)] ?? { agreedSupportDays: 0, usedSupportDays: 0 };
        const availableYears = Array.from(new Set([
          currentYear,
          ...Object.keys(supportYears)
            .map(key => Number(key))
            .filter(year => Number.isFinite(year) && Number.isInteger(year))
        ])).sort((a, b) => b - a);
        const releaseNotes = (await this.listReleaseNotes(brand, { publishedOnly: true }))
          .map(note => ({ ...note, renderedBody: renderReleaseNoteBody(note.body) }));

        return {
          agreedSupportDays: yearData.agreedSupportDays,
          usedSupportDays: yearData.usedSupportDays,
          selectedYear: resolvedSelectedYear,
          availableYears,
          currentYear,
          releaseNotes
        };
      } catch (error) {
        throw toError(error);
      }
    }
  }
}
