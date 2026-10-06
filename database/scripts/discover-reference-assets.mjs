import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2] || 'rjif-reference-package/elementor-extracted';
const output = process.argv[3];
const urls = new Set();
const uploadPattern = /https?:\/\/retailjewellerindiaforum\.com\/wp-content\/uploads\/[^\s"'<>]+/g;

function collect(value) {
  if (Array.isArray(value)) return value.forEach(collect);
  if (value && typeof value === 'object') return Object.values(value).forEach(collect);
  if (typeof value !== 'string') return;
  for (const match of value.matchAll(uploadPattern)) urls.add(match[0].replaceAll('\\/', '/'));
}

function visit(location) {
  const info = fs.statSync(location);
  if (info.isDirectory()) {
    for (const name of fs.readdirSync(location)) visit(path.join(location, name));
    return;
  }
  if (!location.endsWith('.json')) return;
  collect(JSON.parse(fs.readFileSync(location, 'utf8')));
}

visit(source);
const assets = [...urls].sort().map(url => ({
  source_url: url,
  archive_path: `uploads/${decodeURIComponent(url.split('/wp-content/uploads/')[1])}`,
  public_path: `/reference/${decodeURIComponent(url.split('/wp-content/uploads/')[1])}`
}));
const text = JSON.stringify(assets, null, 2);
if (output) fs.writeFileSync(output, `${text}\n`);
else process.stdout.write(`${text}\n`);

