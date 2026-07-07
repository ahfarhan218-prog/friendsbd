const fs = require('fs');
const path = require('path');
const dir = 'pages';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const p = path.join(dir, file);
  const c = fs.readFileSync(p, 'utf8');
  const nc = c.replace(/className="min-h-screen\s+bg-(?:\[#[A-Fa-f0-9]+\]|[a-z0-9-]+)/g, 'className="min-h-screen bg-transparent');
  if (c !== nc) {
    fs.writeFileSync(p, nc);
    console.log('Updated', file);
  }
}
