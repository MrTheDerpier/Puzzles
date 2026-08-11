const fs = require('fs');
const required = ['index.html', 'src/app.js', 'src/styles.css', 'manifest.webmanifest', 'sw.js'];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
}
JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
console.log('Static app files are present and manifest JSON is valid.');
