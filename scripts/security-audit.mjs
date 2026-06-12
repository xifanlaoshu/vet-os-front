import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cwd } from 'node:process';

const root = cwd();
const sourceFiles = listSourceFiles(join(root, 'src'));
const findings = [];

auditAuthSessionPersistence();
auditTenantContextRequestHeaders();

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
  {
    rule: 'no-console-in-runtime',
    pattern: /\bconsole\.\w+\s*\(/,
    message: 'Do not ship console.* in production frontend runtime code; use devLog for development-only diagnostics.',
    allowFilePatterns: [
      /^scripts[\\/]/,
      /^src[\\/]views[\\/]demos[\\/]/,
      /^src[\\/]utils[\\/]devLog\.ts$/,
      /^src[\\/]utils[\\/]log\.ts$/,
    ],
  },
  {
    rule: 'no-raw-request-error-log',
    pattern: /\braw\s*:\s*error\b/,
    message: 'Do not log raw request error objects because they may contain Authorization headers.',
  },
  {
    rule: 'no-refresh-token-in-url',
    pattern: /[?&]refreshToken=|refreshToken\s*[:=]\s*[^;\n]*(?:url|query|params)/i,
    message: 'Do not place refresh tokens in URLs, query strings, or route params; send them in the request body only.',
  },
  {
    rule: 'no-client-side-business-export',
    pattern: /\bexport-file-name\b|\bexportFileName\s*[:=]/,
    message: 'Business data exports must use audited backend export, not client-side table export.',
    allowFilePatterns: [
      /^src[\\/]views[\\/]demos[\\/]/,
      /^src[\\/]components[\\/]core[\\/]dynamic-table[\\/]/,
    ],
  },
];

for (const file of sourceFiles) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const relFile = relative(root, file);

  lines.forEach((lineText, index) => {
    if (lineText.trim().startsWith('//'))
      return;

    for (const { rule, pattern, message, allowFiles = [], allowFilePatterns = [] } of rules) {
      if (allowFiles.includes(relFile))
        continue;
      if (allowFilePatterns.some(filePattern => filePattern.test(relFile)))
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

function auditAuthSessionPersistence() {
  const userStorePath = join(root, 'src', 'store', 'modules', 'user.ts');
  if (!existsSync(userStorePath))
    return;

  const content = readFileSync(userStorePath, 'utf8');
  if (!/persist\s*:\s*\{[\s\S]*storage\s*:\s*sessionStorage[\s\S]*pick\s*:\s*\[[\s\S]*['"`]token['"`][\s\S]*['"`]refreshToken['"`]/.test(content)) {
    findings.push({
      file: 'src/store/modules/user.ts',
      line: 1,
      rule: 'auth-session-storage-required',
      message: 'Auth tokens must be persisted only in sessionStorage, never long-lived localStorage.',
    });
  }

  if (/localStorage\.(?:setItem|getItem)\([^)]*(?:token|refreshToken|ACCESS_TOKEN|USER_PERSIST_KEY)/i.test(content)) {
    findings.push({
      file: 'src/store/modules/user.ts',
      line: 1,
      rule: 'no-auth-token-local-storage',
      message: 'Do not read or write auth tokens through localStorage.',
    });
  }
}

function auditTenantContextRequestHeaders() {
  const requestPath = join(root, 'src', 'utils', 'request.ts');
  if (!existsSync(requestPath))
    return;

  const content = readFileSync(requestPath, 'utf8');
  const requiredPatterns = [
    {
      pattern: /!userStore\.contextSelected\s*&&\s*!isTenantContextBootstrapApi\(config\.url\)/,
      rule: 'missing-client-tenant-context-block',
      message: 'Business API requests must be blocked before tenant and area context is selected.',
    },
    {
      pattern: /headers\[['"`]X-Area-Id['"`]\]\s*=\s*String\(userStore\.areaId\)/,
      rule: 'missing-client-area-header',
      message: 'Business API requests must carry X-Area-Id after context selection.',
    },
    {
      pattern: /originalConfig\.url\s*!==\s*AUTH_REFRESH_URL/,
      rule: 'refresh-request-loop-guard-required',
      message: 'Access-token refresh retry logic must not recursively refresh the refresh endpoint.',
    },
  ];

  requiredPatterns.forEach(({ pattern, rule, message }) => {
    if (pattern.test(content))
      return;
    findings.push({
      file: 'src/utils/request.ts',
      line: 1,
      rule,
      message,
    });
  });
}

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
