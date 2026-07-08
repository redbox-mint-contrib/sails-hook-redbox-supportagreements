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
