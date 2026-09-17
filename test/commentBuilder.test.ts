import { describe, expect, it } from 'vitest';
import { buildComment, hasCommentMarker } from '../src/commentBuilder';
import type { DataKitDefinition } from '../src/dataKitParser';

const kit: DataKitDefinition = {
  filePath: 'force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml',
  developerName: 'Acme_Sample_V1',
  masterLabel: 'Acme - Sample V1',
  isAutoSequence: true,
  sequence: [
    { devName: 'Acme_Knowledge_Article', type: 'DataStream' },
    { devName: 'Acme_UserFAQ_Kav1', type: 'DataSemanticSearch', id: '18lAP000001Eug5YAC' },
  ],
};

describe('buildComment', () => {
  it('includes the marker, kit label, and one row per sequence item', () => {
    const comment = buildComment([kit]);

    expect(hasCommentMarker(comment)).toBe(true);
    expect(comment).toContain('Acme - Sample V1');
    expect(comment).toContain('Acme_Knowledge_Article');
    expect(comment).toContain('DataSemanticSearch');
    expect(comment).toContain('18lAP000001Eug5YAC');
  });

  it('renders a placeholder row for an empty sequence', () => {
    const comment = buildComment([{ ...kit, sequence: [] }]);
    expect(comment).toContain('_empty sequence_');
  });
});
