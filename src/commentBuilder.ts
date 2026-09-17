import type { DataKitDefinition } from './dataKitParser';

export const COMMENT_MARKER = '<!-- sf-datapackagekit-pr-notifier -->';

export function buildComment(kits: DataKitDefinition[]): string {
  const sections = kits.map((kit) => {
    const rows = kit.sequence
      .map((item, index) => `| ${index + 1} | ${item.devName} | ${item.type} | ${item.id ?? ''} |`)
      .join('\n');

    return [
      `### ${kit.masterLabel || kit.developerName} (\`${kit.filePath}\`)`,
      '',
      `Auto sequence: ${kit.isAutoSequence ? 'yes' : 'no'}`,
      '',
      '| # | Dev Name | Type | Id |',
      '| - | -------- | ---- | -- |',
      rows || '| - | _empty sequence_ | - | - |',
    ].join('\n');
  });

  return [COMMENT_MARKER, '## Data Package Kit deployment order', '', ...sections].join('\n');
}

export function hasCommentMarker(body: string): boolean {
  return body.includes(COMMENT_MARKER);
}
