import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cwd } from 'node:process';

const root = cwd();
const sourceFiles = listSourceFiles(join(root, 'src'));
const findings = [];

const rules = [
  {
    rule: 'no-dangerous-html',
    pattern: /\b(v-html|innerHTML|outerHTML)\b/,
    message: 'Do not render unsanitized HTML.',
  },
  {
    rule: 'no-weak-default-password',
    pattern: /a123456|(?<!\d)123456(?!\d)/,
    message: 'Do not ship weak default passwords in frontend code.',
  },
  {
    rule: 'no-direct-window-open',
    pattern: /\bwindow\.open\s*\(/,
    message: 'Use safeOpen() instead of direct window.open().',
    allowFiles: ['src\\utils\\safeOpen.ts', 'src/utils/safeOpen.ts'],
  },
];

for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relFile = relative(root, file);

  lines.forEach((lineText, index) => {
    if (lineText.trim().startsWith('//'))
      return;

    for (const { rule, pattern, message, allowFiles = [] } of rules) {
      if (allowFiles.includes(relFile))
        continue;
      if (!pattern.test(lineText))
        continue;
      findings.push({
        file: relFile,
        line: index + 1,
        rule,
        message,
      });
    }
  });
}

if (findings.length) {
  console.error('Security audit failed:');
  findings.forEach((finding) => {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
  });
  process.exit(1);
}

console.log('Security audit passed.');

function listSourceFiles(dir) {
  const result = [];
  for (const entry of readdirSync(dir)) {
    const absPath = join(dir, entry);
    const stat = statSync(absPath);
    if (stat.isDirectory()) {
      if (absPath.includes(`${join('src', 'api', 'backend')}`))
        continue;
      result.push(...listSourceFiles(absPath));
      continue;
    }
    if (/\.(ts|tsx|vue)$/.test(entry) && !entry.endsWith('.spec.ts'))
      result.push(absPath);
  }
  return result;
}
