export {};

const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { requireFromRedboxContract } = require('@researchdatabox/redbox-dev-tools/runtime-resolver');
const ejs = requireFromRedboxContract('ejs');
const fs = require('node:fs');
const sinon = require('sinon');
const path = require('node:path');
const os = require('node:os');
const { installSupportAgreementTestGlobals, clearSupportAgreementTestGlobals } = require('../support/globals');
const { Controllers } = require('../../src/api/controllers/SupportAgreementController');
const root = path.resolve(__dirname, '../..');

// Exercise the real core resolver and sendView, then real EJS filesystem includes.
// In particular, EJS receives only the portal mirror roots added by sendView.
describe('Support agreement filesystem layout rendering', () => {
  let appPath: string;
  afterEach(() => {
    clearSupportAgreementTestGlobals();
    fs.rmSync(appPath, { recursive: true, force: true });
  });

  const cases = [
    { name: 'stock develop shell', source: 'develop', location: 'core', shared: true },
    { name: 'stock 5.0.5 legacy sidebar', source: 'v5.0.5', location: 'core', shared: false },
    { name: 'brand shell outside the page mirror', source: 'develop', location: 'brand', shared: true },
    { name: 'another hook shell outside the page mirror', source: 'develop', location: 'hook', shared: true },
    ...['start', 'end', 'page-header'].map(missing => ({
      name: `incomplete shell without ${missing}`, source: 'develop', location: 'core', shared: false, missing
    }))
  ];
  for (const scenario of cases) {
    it(`detects and renders ${scenario.name}`, async () => {
      appPath = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sa-layout-render-')));
      const plugin = path.join(appPath, 'node_modules/support-agreement-plugin');
      const otherHook = path.join(appPath, 'node_modules/brand-shell-hook');
      for (const hook of [plugin, otherHook]) {
        fs.mkdirSync(hook, { recursive: true });
        fs.writeFileSync(path.join(hook, 'package.json'), JSON.stringify({ sails: { isHook: true } }));
      }
      fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify({
        dependencies: { 'support-agreement-plugin': '1.0.0', 'brand-shell-hook': '1.0.0' }
      }));
      const page = path.join(plugin, 'views/default/default/admin/supportAgreement.ejs');
      fs.mkdirSync(path.dirname(page), { recursive: true });
      fs.copyFileSync(path.join(root, 'views/default/default/admin/supportAgreement.ejs'), page);
      const layoutDir = scenario.location === 'hook'
        ? path.join(otherHook, 'views/default/default/admin/layout')
        : path.join(appPath, 'views', scenario.location === 'brand' ? 'uwa/rdmp' : 'default/default', 'admin/layout');
      fs.mkdirSync(layoutDir, { recursive: true });
      for (const name of fs.readdirSync(path.join(root, 'test/fixtures/admin-layout', scenario.source))) {
        if ('missing' in scenario && name === `${scenario.missing}.ejs`) continue;
        fs.copyFileSync(path.join(root, 'test/fixtures/admin-layout', scenario.source, name), path.join(layoutDir, name));
      }
      installSupportAgreementTestGlobals({ appPath, ng2: { use_bundled: false } });
      const globals = globalThis as unknown as Record<string, Record<string, ReturnType<typeof sinon.stub>>>;
      globals.BrandingService.getBrandFromReq.returns({ id: 'brand-1', name: 'uwa' });
      globals.supportagreementservice.getManagementViewModel.resolves({
        agreedSupportDays: 10, usedSupportDays: 2.5, selectedYear: 2026,
        availableYears: [2026, 2025], currentYear: 2026, releaseNotes: []
      });
      const req = {
        user: { username: 'admin' }, session: { branding: 'uwa' }, query: {},
        path: '/uwa/rdmp/admin/supportAgreement',
        param: (name: string) => ({ branding: 'uwa', portal: 'rdmp' }[name])
      } as unknown as Sails.Req;
      let html = '';
      const res = {
        view: (view: string, locals: Record<string, unknown>) => {
          expect(locals.hasSharedAdminShell).to.equal(scenario.shared);
          const partials = locals.adminLayoutPartials as Record<string, string | null>;
          expect(partials.sidebar).to.equal(path.join(layoutDir, 'sidebar.ejs'));
          if (scenario.shared) expect(partials.start).to.equal(path.join(layoutDir, 'start.ejs'));
          const filename = `${view}.ejs`;
          html = ejs.render(fs.readFileSync(filename, 'utf8'), {
            ...locals, req, contentSecurityPolicyNonce: 'test-nonce', _csrf: 'test-token',
            TranslationService: { t: (key: string) => key },
            BrandingService: { getRootContext: () => '', getBrandAndPortalPath: () => '/uwa/rdmp' }
          }, { filename, views: locals.views });
        }
      } as unknown as Sails.Res;
      await new Controllers.SupportAgreement().index(req, res);
      expect(html).to.include(scenario.shared ? 'id="rb-admin-main"' : 'class="row admin-layout"');
      expect(html).to.include(scenario.source === 'v5.0.5' ? 'class="admin-sidebar"' : 'class="rb-admin-sidebar"');
      expect(html).to.include('75% available');
      expect(html).to.include('name="_csrf" value="test-token"');
      const version = require('../../package.json').version;
      expect(html).to.include(`/styles/support-agreements/admin.css?v=${version}`);
      expect(html).to.include(`/js/support-agreements/admin.js?v=${version}`);
    });
  }
});
