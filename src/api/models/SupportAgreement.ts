import {
  Attr,
  BelongsTo,
  BeforeCreate,
  Entity,
  toWaterlineModelDef
} from '@researchdatabox/redbox-core';

export interface SupportAgreementYear {
  agreedSupportDays: number;
  usedSupportDays: number;
}

export interface ReleaseNote {
  id: string;
  title: string;
  body: string;
  releaseDate?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

type BrandingReference = string | number | Record<string, unknown>;

@BeforeCreate((recordOrRecords: Record<string, unknown>, proceed: (err?: Error) => void): void => {
  const record = recordOrRecords;
  const branding = record.branding;
  if (typeof branding === 'undefined' || branding === null || branding === '') {
    proceed(new Error('Branding is required'));
    return;
  }

  record.key = `${String(branding)}_support-agreement`;
  proceed();
})
@Entity('supportagreement')
export class SupportAgreementClass {
  @Attr({ type: 'string', unique: true })
  key?: string;

  @BelongsTo('brandingconfig', { required: true })
  branding?: BrandingReference;

  @Attr({ type: 'json' })
  supportYears?: Record<string, SupportAgreementYear>;

  @Attr({ type: 'json' })
  releaseNotes?: ReleaseNote[];
}

export const SupportAgreementWLDef = toWaterlineModelDef(SupportAgreementClass);

export interface SupportAgreementAttributes extends Sails.WaterlineAttributes {
  key?: string;
  branding: BrandingReference;
  supportYears?: Record<string, SupportAgreementYear>;
  releaseNotes?: ReleaseNote[];
}

export interface SupportAgreementWaterlineModel extends Sails.Model<SupportAgreementAttributes> {
  attributes: SupportAgreementAttributes;
}

declare global {
  const SupportAgreement: SupportAgreementWaterlineModel;
}
