import { execFileSync } from 'node:child_process';

function ensureRefsAvailable(baseRef: string, headRef: string): void {
  for (const ref of [baseRef, headRef]) {
    try {
      execFileSync('git', ['cat-file', '-e', ref], { stdio: 'ignore' });
    } catch {
      try {
        execFileSync('git', ['fetch', '--depth=100', 'origin', ref], { stdio: 'ignore' });
      } catch {
        // best effort; the diff below will surface a clear error if the ref is truly missing
      }
    }
  }
}

export function getChangedFiles(baseRef: string, headRef: string): string[] {
  ensureRefsAvailable(baseRef, headRef);
  const output = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...${headRef}`], {
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
