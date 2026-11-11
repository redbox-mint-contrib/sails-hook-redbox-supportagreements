export {};

const { expect } = require('@researchdatabox/redbox-dev-tools/testing');
const { resolveHookStaticAssetPath } = require('@researchdatabox/redbox-core/dist/config/http.config');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '../..');

describe('Support agreement assets', () => {
  let appPath: string;

  before(() => {
    appPath = fs.mkdtempSync(path.join(os.tmpdir(), 'support-agreement-assets-'));
    const name = '@researchdatabox/sails-hook-redbox-supportagreements';
    fs.writeFileSync(path.join(appPath, 'package.json'), JSON.stringify({ dependencies: { [name]: '0.0.1-beta.0' } }));
    fs.mkdirSync(path.join(appPath, 'node_modules/@researchdatabox'), { recursive: true });
    fs.symlinkSync(root, path.join(appPath, 'node_modules', name), 'dir');
  });

  after(() => fs.rmSync(appPath, { recursive: true, force: true }));

  for (const asset of ['styles/support-agreements/admin.css', 'js/support-agreements/admin.js']) {
    it(`serves ${asset} through core's hook asset resolver`, () => {
      const resolved = resolveHookStaticAssetPath(appPath, `/${asset}`);
      expect(resolved).to.be.a('string');
      expect(fs.realpathSync(resolved)).to.equal(path.join(root, 'assets', asset));
    });
  }
});
