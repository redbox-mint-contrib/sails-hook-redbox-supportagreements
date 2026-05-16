# sails-hook-redbox-supportagreements

ReDBox hook package for support-agreement administration.

Initial scope:

- own the `/admin/supportAgreement` route
- render the support-agreement admin view from the hook
- keep the existing core support-agreement data model and sidebar config in place for now

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
