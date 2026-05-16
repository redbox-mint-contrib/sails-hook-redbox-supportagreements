# Support Agreement Data Model, Release Notes, And REST API

## Summary

Extend `@researchdatabox/sails-hook-redbox-supportagreements` so the hook owns support-agreement data in its own Waterline collection instead of reading from `BrandingConfiguration.supportAgreementInformation`.

The hook will add:

- One brand-scoped Waterline model/DB collection.
- A service layer for all support-agreement and release-note operations.
- REST webservice endpoints for reading and updating support years and release notes.
- Updated admin page rendering that reads from the new collection.
- Release-note display on the existing `/admin/supportAgreement` page.
- Unit tests for model export, service behavior, controller rendering, and REST controller behavior.

No automatic migration/backfill will be added in this pass. Existing `BrandingConfiguration.supportAgreementInformation` data remains untouched and will no longer be the primary read source once this hook feature lands.

## Hook Capability Changes

Update `package.json` `sails` capabilities:

```json
{
  "isHook": true,
  "hasModels": true,
  "hasServices": true,
  "hasControllers": true,
  "hasWebserviceControllers": true,
  "hasConfig": true
}
```

Update `src/index.ts` to add these exports:

- `registerRedboxModels()`
- `registerRedboxServices()`
- `registerRedboxWebserviceControllers()`

Keep existing exports:

- `registerRedboxControllers()`
- `registerRedboxConfig()`

Do not add `hasBootstrap`; no migration/backfill runs in this pass.

## Data Model

Add one Waterline model:

`src/api/models/SupportAgreement.ts`

Model export key/global id:

- `SupportAgreement`

Collection identity:

- `supportagreement`

Collection role:

- One document per brand.

Fields:

- `key: string`
  - Unique.
  - Format: `${branding}_support-agreement`
  - Assigned in `beforeCreate`.
- `branding: string | number`
  - `BelongsTo('brandingconfig', { required: true })`
- `supportYears: json`
  - Shape: `Record<string, SupportAgreementYear>`
  - Example:
    ```json
    {
      "2026": { "agreedSupportDays": 20, "usedSupportDays": 4 }
    }
    ```
- `releaseNotes: json`
  - Shape: `ReleaseNote[]`
  - Markdown document model chosen by the user.
  - Example:
    ```json
    [
      {
        "id": "uuid",
        "title": "Portal 2.4.0",
        "body": "Markdown content",
        "releaseDate": "2026-05-16",
        "published": true,
        "createdAt": "2026-05-16T01:30:00.000Z",
        "updatedAt": "2026-05-16T01:30:00.000Z"
      }
    ]
    ```

Type interfaces:

```ts
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

export interface SupportAgreementAttributes extends Sails.WaterlineAttributes {
  key?: string;
  branding: string | number | BrandingConfigAttributes;
  supportYears?: Record<string, SupportAgreementYear>;
  releaseNotes?: ReleaseNote[];
}
```

Register model exports in:

- `src/api/models/index.ts`

```ts
export const ModelExports = {
  SupportAgreement: SupportAgreementWLDef
};
```

## Service Layer

Add:

- `src/api/services/SupportAgreementService.ts`
- `src/api/services/index.ts`

Service export key:

- `supportagreementservice`

Class:

- `Services.SupportAgreement extends services.Core.Service`

Exported methods:

- `getForBrand`
- `getOrCreateForBrand`
- `getYear`
- `setYear`
- `deleteYear`
- `listReleaseNotes`
- `getReleaseNote`
- `createReleaseNote`
- `updateReleaseNote`
- `deleteReleaseNote`
- `getViewModel`

Service behavior:

- Resolve brand id from a `BrandingModel` or brand name.
- Store one record per brand.
- Create an empty record lazily when a mutation requires one.
- Never mutate `BrandingConfiguration.supportAgreementInformation`.
- Validate years as finite integers.
- Normalize year keys to strings in storage.
- Coerce support-day values to non-negative numbers.
- Sort available support years descending and always include the current year.
- Sort release notes descending by `releaseDate`, then `createdAt`.
- For the admin page, only return `published === true` release notes by default.
- For admin REST APIs, return all release notes unless a `publishedOnly=true` query parameter is supplied.

`getViewModel(brand, selectedYear)` returns:

```ts
{
  agreedSupportDays: number;
  usedSupportDays: number;
  selectedYear: number;
  availableYears: number[];
  currentYear: number;
  releaseNotes: ReleaseNote[];
}
```

Current-year fallback:

- Because the user selected “No migration now”, the new service does not automatically backfill from core branding data.
- For compatibility during rollout, the admin page may optionally use legacy core data only as a read fallback if the new document does not exist.
- The REST APIs must not write legacy data.
- Recommended default: no legacy fallback in service, but keep a small fallback in the existing page controller for one release only if needed. Since the request says “move data out”, the implementation should read only the new model unless an existing test proves the fallback is required.

## Admin Page Controller

Update:

- `src/api/controllers/SupportAgreementController.ts`

Change `index()` to:

1. Resolve brand from request:
   - `BrandingService.getBrand(req.session.branding as string)` or `BrandingService.getBrandFromReq(req)` if available.
2. Parse `req.query.year`.
3. Call:
   - `SupportAgreementService.getViewModel(brand, selectedYear)`
4. Render:
   - `admin/supportAgreement`
5. Pass locals:
   - `agreedSupportDays`
   - `usedSupportDays`
   - `selectedYear`
   - `availableYears`
   - `currentYear`
   - `releaseNotes`

Remove direct reads from `brand.supportAgreementInformation`.

## View Changes

Update:

- `views/default/default/admin/supportAgreement.ejs`

Keep the existing support-year panel.

Add a release-notes section below the support-agreement details panel:

- Heading: translation key `release-notes-title`
- Empty state: translation key `no-release-notes-configured`
- For each release note:
  - Title
  - Optional release date
  - Markdown body rendered as HTML

Markdown rendering rule:

- Do not render raw markdown directly through EJS.
- Service or controller should convert markdown to sanitized HTML before passing to the view, or the view should escape body text if no sanitizer is available.
- Recommended implementation: use existing ReDBox sanitization utilities if exposed by core; otherwise add a minimal internal markdown-to-HTML dependency only if already acceptable in hook dependency policy.
- Conservative default for this pass: render markdown body as escaped preformatted text with basic line breaks, and defer rich markdown rendering to a later UI pass.

Add default language keys only if the hook already has a language-defaults mechanism. Otherwise rely on literal fallback text in the EJS only where necessary.

## REST API

Add webservice controller:

- `src/api/controllers/webservice/SupportAgreementController.ts`

Export key:

- `SupportAgreementController`

Routes in `src/config/routes.ts`:

```ts
'get /:branding/:portal/api/support-agreements': {
  controller: 'webservice/SupportAgreementController',
  action: 'getSettings',
  csrf: false
}

'get /:branding/:portal/api/support-agreements/years': {
  controller: 'webservice/SupportAgreementController',
  action: 'listYears',
  csrf: false
}

'put /:branding/:portal/api/support-agreements/years/:year': {
  controller: 'webservice/SupportAgreementController',
  action: 'setYear',
  csrf: false
}

'delete /:branding/:portal/api/support-agreements/years/:year': {
  controller: 'webservice/SupportAgreementController',
  action: 'deleteYear',
  csrf: false
}

'get /:branding/:portal/api/support-agreements/release-notes': {
  controller: 'webservice/SupportAgreementController',
  action: 'listReleaseNotes',
  csrf: false
}

'post /:branding/:portal/api/support-agreements/release-notes': {
  controller: 'webservice/SupportAgreementController',
  action: 'createReleaseNote',
  csrf: false
}

'patch /:branding/:portal/api/support-agreements/release-notes/:id': {
  controller: 'webservice/SupportAgreementController',
  action: 'updateReleaseNote',
  csrf: false
}

'delete /:branding/:portal/api/support-agreements/release-notes/:id': {
  controller: 'webservice/SupportAgreementController',
  action: 'deleteReleaseNote',
  csrf: false
}
```

Response style:

- Use `this.sendResp(req, res, { data, headers: this.getNoCacheHeaders() })`.
- Validation errors return `400`.
- Missing release note returns `404`.
- Unexpected errors return `500`.

Request/response contracts:

`GET /api/support-agreements`

Returns:

```json
{
  "supportYears": {
    "2026": { "agreedSupportDays": 20, "usedSupportDays": 4 }
  },
  "releaseNotes": []
}
```

`PUT /api/support-agreements/years/:year`

Body:

```json
{
  "agreedSupportDays": 20,
  "usedSupportDays": 4
}
```

Returns the saved year object.

`DELETE /api/support-agreements/years/:year`

Returns:

```json
{ "status": true }
```

`GET /api/support-agreements/release-notes`

Optional query:

- `publishedOnly=true`

Returns:

```json
[
  {
    "id": "uuid",
    "title": "Release title",
    "body": "Markdown body",
    "releaseDate": "2026-05-16",
    "published": true,
    "createdAt": "2026-05-16T01:30:00.000Z",
    "updatedAt": "2026-05-16T01:30:00.000Z"
  }
]
```

`POST /api/support-agreements/release-notes`

Body:

```json
{
  "title": "Release title",
  "body": "Markdown body",
  "releaseDate": "2026-05-16",
  "published": true
}
```

Returns `201` with the created note.

`PATCH /api/support-agreements/release-notes/:id`

Body may include any of:

```json
{
  "title": "Updated title",
  "body": "Updated markdown body",
  "releaseDate": "2026-05-17",
  "published": false
}
```

Returns the updated note.

`DELETE /api/support-agreements/release-notes/:id`

Returns:

```json
{ "status": true }
```

## Auth Config

Add hook config export for `auth` rules so Admin users can manage the new API.

Add `src/config/auth.ts`:

```ts
export const auth = {
  rules: [
    { path: '/:branding/:portal/api/support-agreements(/*)', role: 'Admin', can_update: true },
    { path: '/:branding/:portal/api/support-agreements', role: 'Admin', can_read: true }
  ]
};
```

Return both `routes` and `auth` from `registerRedboxConfig()`.

Because core already has a broad `/:branding/:portal/api(/*)` Admin rule, this explicit hook rule is mainly documentation and resilience if core auth becomes stricter later.

## Files To Add

- `src/api/models/SupportAgreement.ts`
- `src/api/models/index.ts`
- `src/api/services/SupportAgreementService.ts`
- `src/api/services/index.ts`
- `src/api/controllers/webservice/SupportAgreementController.ts`
- `src/api/controllers/webservice/index.ts`
- `src/config/auth.ts`
- Unit tests for model/service/webservice controller behavior.

## Files To Modify

- `package.json`
  - Add `hasModels`, `hasServices`, `hasWebserviceControllers`.
- `src/index.ts`
  - Register models, services, webservice controllers, and auth config.
- `src/config/routes.ts`
  - Add REST API routes.
- `src/api/controllers/SupportAgreementController.ts`
  - Read through `SupportAgreementService`.
- `src/api/controllers/index.ts`
  - Keep app controller export.
- `views/default/default/admin/supportAgreement.ejs`
  - Display release notes.
- `test/support/globals.ts`
  - Add model and service stubs.
- Existing controller tests
  - Update expected locals to include release notes.

## Test Cases

Model/export tests:

- `registerRedboxModels()` includes `SupportAgreement`.
- Model identity is `supportagreement`.
- Model has `branding`, `key`, `supportYears`, and `releaseNotes`.

Service tests:

- `getOrCreateForBrand()` creates a new document when none exists.
- `getForBrand()` returns existing document.
- `setYear()` validates year and saves support days.
- `setYear()` rejects invalid year values.
- `setYear()` clamps or rejects negative support-day values. Recommended: reject with validation error.
- `deleteYear()` removes only the requested year.
- `getViewModel()` includes current year in `availableYears`.
- `createReleaseNote()` assigns `id`, `createdAt`, and `updatedAt`.
- `updateReleaseNote()` changes only supplied fields and refreshes `updatedAt`.
- `deleteReleaseNote()` removes a note by id.
- `listReleaseNotes({ publishedOnly: true })` excludes unpublished notes.
- Release notes sort newest first.

Admin page controller tests:

- Calls `SupportAgreementService.getViewModel()`.
- Renders `admin/supportAgreement`.
- Passes release notes to the EJS locals.

REST controller tests:

- `GET /settings` returns support years and release notes.
- `PUT /years/:year` returns saved data.
- Invalid year update returns `400`.
- `DELETE /years/:year` returns status true.
- `GET /release-notes` returns notes.
- `POST /release-notes` returns `201`.
- Invalid release note create returns `400`.
- `PATCH /release-notes/:id` returns updated note.
- Missing note patch/delete returns `404`.
- Unexpected service error returns `500`.

Verification commands:

```bash
npm run compile
npm run test:unit
docker compose -f ./support/development/docker-compose.yml config
npm run dev:run:build
```

Optional manual verification after implementation:

```bash
npm run dev:run
```

Then verify:

- `http://localhost:1500/default/rdmp/admin/supportAgreement` loads.
- Support-day data shown comes from the new collection.
- Release notes render on the page.
- REST API calls work against `/:branding/:portal/api/support-agreements`.

## Explicit Assumptions

- Storage uses one brand-scoped document in one collection.
- No migration or backfill from `BrandingConfiguration.supportAgreementInformation` in this pass.
- Old branding config data remains untouched.
- Release notes use a markdown document model: `title`, `body`, optional `releaseDate`, and `published`.
- Release notes display on the existing support-agreement admin page.
- REST API is Admin-only and lives under `/:branding/:portal/api/support-agreements`.
- The first implementation renders release-note body safely; rich markdown rendering can be improved later if a sanitizer/markdown renderer is already available or explicitly approved.
