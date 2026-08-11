const fs = require('fs');
const required = ['index.html', 'src/app.js', 'src/styles.css', 'manifest.webmanifest', 'sw.js'];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
if (manifest.start_url !== './' || manifest.scope !== './') {
  throw new Error('Manifest must use relative start_url and scope for GitHub Pages project hosting.');
}
const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('src/app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const rootAbsoluteAsset = /(?:href|src)="\//.test(html) || /register\('\//.test(app) || /'\/(?:index|manifest|icons|src)/.test(sw);
if (rootAbsoluteAsset) throw new Error('Use relative asset paths so the app works from a GitHub Pages subpath.');
console.log('Static app files are present, manifest JSON is valid, and asset paths are GitHub Pages friendly.');
