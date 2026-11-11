# sails-hook-redbox-supportagreements

ReDBox hook package for support-agreement administration.

## Development

```bash
npm install
npm run compile
npm run test:unit
```

To run a local ReDBox portal with this hook installed:

```bash
npm run dev:run:build
npm run dev:run
```

The portal is exposed at `http://localhost:1500`. The Node inspector is exposed at `localhost:9876`.

To clean the development stack:

```bash
npm run dev:run:clean
```

## Structure

- `src/index.ts`: hook entrypoint
- `src/config/routes.ts`: route overrides
- `src/api/controllers`: hook controllers
- `views/`: copied EJS templates

## Admin page compatibility and CSP

The next CI beta fixes the admin page for nonce-based Content Security Policy.
The plugin packages its stylesheet and year-selector script in `assets/`, which
core serves directly from hooks. Remaining support days use a native `progress`
element, so no inline styles or event handlers are needed.

Supported cores are npm `5.0.5` and the `5.1.0` beta series. The controller checks
for the shared admin shell through core's branding/hook-aware view resolver.
Cores with `start`, `end`, and `page-header` partials use the shared shell and
breadcrumbs; core `5.0.5`, which only has the sidebar partial, keeps its existing
admin layout. The CSP nonce is optional when CSP is disabled. The peer dependency
is `^5.0.5 || ^5.1.0-0`; development uses exact core/dev-tools `5.0.5` pins to test
the minimum supported release.

Institution view overrides still take precedence. Remove the support-agreement
view override after verifying this plugin in that institution's portal. All 12
client translation keys below are unchanged; the shared shell uses core's own
existing navigation translations.

CI sets the published version from the requested release base and pipeline
number in `support/build/npm-publish-package.sh`. The source version stays
`0.0.1-beta.0`; it is not manually bumped to `0.0.1-beta.8`.

## Client Hook Language Defaults

Add these values to client hooks that install the support-agreements admin page.

`language-defaults/en/translation.json`:

```json
"support-agreement-title": "Support agreement",
"select-year": "Select year",
"current-year": "current year",
"support-agreement-details": "Support agreement details",
"agreed-support-days": "Agreed support days",
"used-support-days": "Used support days",
"remaining-support-days": "Remaining support days",
"no-agreement-configured": "No support agreement configured for this year.",
"note": "Note",
"support-agreement-note": "Support agreement figures are managed by ReDBox support administrators.",
"release-notes-title": "Release notes",
"no-release-notes-configured": "No release notes configured."
```

`language-defaults/meta.json`:

```json
"support-agreement-title": {
  "category": "support-agreement",
  "description": "Heading for the support agreement admin page"
},
"select-year": {
  "category": "support-agreement",
  "description": "Label for selecting a support agreement year"
},
"current-year": {
  "category": "support-agreement",
  "description": "Label shown beside the current support agreement year"
},
"support-agreement-details": {
  "category": "support-agreement",
  "description": "Panel heading for support agreement details"
},
"agreed-support-days": {
  "category": "support-agreement",
  "description": "Label for the agreed support days value"
},
"used-support-days": {
  "category": "support-agreement",
  "description": "Label for the used support days value"
},
"remaining-support-days": {
  "category": "support-agreement",
  "description": "Label for the remaining support days value"
},
"no-agreement-configured": {
  "category": "support-agreement",
  "description": "Message shown when no support agreement has been configured for the selected year"
},
"note": {
  "category": "support-agreement",
  "description": "Generic note label used by the support agreement page"
},
"support-agreement-note": {
  "category": "support-agreement",
  "description": "Informational note shown on the support agreement page"
},
"release-notes-title": {
  "category": "support-agreement",
  "description": "Heading for the support agreement release notes panel"
},
"no-release-notes-configured": {
  "category": "support-agreement",
  "description": "Message shown when no support agreement release notes are configured"
}
```
