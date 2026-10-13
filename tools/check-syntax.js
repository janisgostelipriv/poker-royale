// Syntaxcheck fuer alle Inline-<script>-Bloecke in index.html
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const re = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, i = 0, ok = true;
while ((m = re.exec(html))) {
  i++;
  const before = html.slice(0, m.index).split('\n').length;
  try {
    new vm.Script(m[1], { filename: `inline-script-${i} (ab Zeile ${before})` });
    console.log(`Block ${i} (ab Zeile ${before}): OK`);
  } catch (e) {
    ok = false;
    console.error(`Block ${i} (ab Zeile ${before}): FEHLER -> ${e.message}`);
  }
}
process.exit(ok ? 0 : 1);

