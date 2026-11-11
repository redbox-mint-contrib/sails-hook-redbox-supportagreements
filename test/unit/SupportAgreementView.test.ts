export {};

const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { requireFromRedboxContract } = require('@researchdatabox/redbox-dev-tools/runtime-resolver');
const ejs = requireFromRedboxContract('ejs');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const filename = path.join(root, 'views/default/default/admin/supportAgreement.ejs');
const template = fs.readFileSync(filename, 'utf8');
const nonce = 'test-csp-nonce';
const assetVersion = require('../../package.json').version;

// The shell belongs to the portal, not this package. These small partials exercise
// real EJS includes and their locals without installing/copying portal views.
const partials: Record<string, string> = {
  'layout/start.ejs': '<main class="rb-admin-main"><%- include("layout/sidebar.ejs") %>',
  'layout/end.ejs': '</main>',
  'layout/sidebar.ejs': '<aside class="test-sidebar"></aside>',
  'layout/page-header.ejs': '<h1><%= TranslationService.t(titleKey) %></h1><a href="<%= breadcrumbs[0].href %>"><%= TranslationService.t(breadcrumbs[0].labelKey) %></a>'
};

function render(overrides: Record<string, unknown> = {}, sharedShell = true): string {
  return ejs.render(template, {
    branding: 'default', portal: 'rdmp',
    req: { path: '/default/rdmp/admin/supportAgreement' },
    BrandingService: { getRootContext: () => '/redbox', getBrandAndPortalPath: () => '/redbox/default/rdmp' },
    TranslationService: { t: (key: string) => key },
    contentSecurityPolicyNonce: nonce,
    _csrf: 'test-csrf-token',
    hasSharedAdminShell: sharedShell,
    assetVersion,
    adminLayoutPartials: {
      start: 'layout/start.ejs', end: 'layout/end.ejs',
      pageHeader: 'layout/page-header.ejs', sidebar: 'layout/sidebar.ejs'
    },
    agreedSupportDays: 10, usedSupportDays: 2.5,
    availableYears: [2026, 2025], selectedYear: 2026, currentYear: 2026,
    canManageSupportAgreements: false,
    releaseNotes: [],
    ...overrides
  }, {
    filename,
    includer: (name: string) => {
      if (!sharedShell && name !== 'layout/sidebar.ejs') {
        throw new Error(`Shared partial unavailable: ${name}`);
      }
      if (!(name in partials)) throw new Error(`Unexpected partial: ${name}`);
      return { template: partials[name] };
    }
  });
}

function assertCsp(html: string): void {
  expect(html).not.to.match(/\sstyle\s*=/i);
  expect(html).not.to.match(/\son\w+\s*=/i);
  for (const tag of html.match(/<(?:style|script)\b[^>]*>/gi) || []) {
    expect(tag).to.include(`nonce="${nonce}"`);
  }
  expect(html).not.to.match(/<style\b/i);
  expect(html).to.include(`href="/redbox/styles/support-agreements/admin.css?v=${assetVersion}"`);
  expect(html).to.include(`src="/redbox/js/support-agreements/admin.js?v=${assetVersion}"`);
}

const note = {
  id: 'release-1', title: 'Release <one>', body: '# Release\n\n<script>unsafe</script>',
  releaseDate: '2026-11-05', published: true,
  renderedBody: '<h1>Release</h1><p>&lt;script&gt;unsafe&lt;/script&gt;</p>'
};

describe('Support agreement view', () => {
  for (const sharedShell of [true, false]) {
    for (const manager of [true, false]) {
      for (const hasAgreement of [true, false]) {
        it(`renders ${sharedShell ? 'shared' : 'legacy'} layout, ${manager ? 'manager' : 'reader'}, ${hasAgreement ? 'agreement and notes' : 'empty state'} under nonce CSP`, () => {
          const html = render({
            canManageSupportAgreements: manager,
            agreedSupportDays: hasAgreement ? 10 : 0,
            usedSupportDays: hasAgreement ? 2.5 : 0,
            releaseNotes: hasAgreement ? [note] : []
          }, sharedShell);
          assertCsp(html);
          expect(html).to.include(sharedShell ? '<main class="rb-admin-main">' : '<div class="row admin-layout">');
          expect(html).to.include('class="test-sidebar"');
          expect(html).to.include(hasAgreement ? '75% available' : 'no-agreement-configured');
          expect(html).to.include('value="2026" selected');
          if (hasAgreement && !manager) {
            expect(html).to.include(`<div class="sa-release-note">${note.renderedBody}</div>`);
            expect(html).to.include('Release &lt;one&gt;');
          }
          if (!hasAgreement) expect(html).to.include('no-release-notes-configured');
          const postForms = html.match(/<form\b[^>]*method="POST"[^>]*>[\s\S]*?<\/form>/g) || [];
          expect(postForms).to.have.length(manager ? (hasAgreement ? 5 : 3) : 0);
          for (const form of postForms) {
            expect(form).to.include('name="_csrf" value="test-csrf-token"');
          }
        });
      }
    }
  }

  for (const [used, value, color] of [
    [0, 100, 'success'], [5, 50, 'warning'], [8, 20, 'danger'], [12, 0, 'danger']
  ]) {
    it(`renders native progress with ${value}% remaining`, () => {
      const html = render({ usedSupportDays: used });
      expect(html).to.include(`class="sa-progress-meter sa-progress-${color}" max="100" value="${value}"`);
      assertCsp(html);
    });
  }

  it('renders on a legacy core with CSP disabled and no nonce local', () => {
    const html = render({ contentSecurityPolicyNonce: undefined }, false);
    expect(html).to.include(`<script src="/redbox/js/support-agreements/admin.js?v=${assetVersion}"></script>`);
    expect(html).not.to.match(/\s(?:style|on\w+)\s*=/i);
  });

  for (const supportsRequestSubmit of [true, false]) {
    it(`submits the year selector with ${supportsRequestSubmit ? 'requestSubmit' : 'submit fallback'}`, () => {
      let handler: (() => void) | undefined;
      let submitted = 0;
      const selector = {
        form: {
          requestSubmit: supportsRequestSubmit ? () => submitted++ : undefined,
          submit: () => { expect(supportsRequestSubmit).to.equal(false); submitted++; }
        },
        addEventListener: (event: string, listener: () => void) => {
          expect(event).to.equal('change');
          handler = listener;
        }
      };
      vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/support-agreements/admin.js'), 'utf8'), {
        document: { getElementById: (id: string) => { expect(id).to.equal('yearSelector'); return selector; } }
      });
      expect(submitted).to.equal(0);
      expect(handler).to.be.a('function');
      handler?.();
      expect(submitted).to.equal(1);
    });
  }
});
