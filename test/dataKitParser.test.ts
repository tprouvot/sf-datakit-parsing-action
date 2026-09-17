import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { filterDataKitFiles, isDataKitDefinitionFile, parseDataKitXml } from '../src/dataKitParser';

const fixturePath = join(
  __dirname,
  'fixtures/Acme_Sample_V1.dataPackageKitDefinition-meta.xml',
);
const fixtureXml = readFileSync(fixturePath, 'utf8');

describe('isDataKitDefinitionFile', () => {
  it('matches files under a dataPackageKitDefinitions folder', () => {
    expect(
      isDataKitDefinitionFile(
        'force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml',
      ),
    ).toBe(true);
  });

  it('rejects unrelated metadata files', () => {
    expect(isDataKitDefinitionFile('force-app/main/default/classes/Foo.cls')).toBe(false);
  });
});

describe('filterDataKitFiles', () => {
  it('keeps only data kit definition files from a mixed change list', () => {
    const files = [
      'force-app/main/default/classes/Foo.cls',
      'force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml',
    ];
    expect(filterDataKitFiles(files)).toEqual([
      'force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml',
    ]);
  });
});

describe('parseDataKitXml', () => {
  it('decodes the deploymentOrder JSON into a sequence list', () => {
    const result = parseDataKitXml(fixturePath, fixtureXml);

    expect(result.developerName).toBe('Acme_Sample_V1');
    expect(result.masterLabel).toBe('Acme - Sample V1');
    expect(result.isAutoSequence).toBe(true);
    expect(result.sequence).toEqual([
      { devName: 'Acme_Knowledge_Article', type: 'DataStream' },
      { devName: 'Acme_UserFAQ_Kav1', type: 'DataSemanticSearch', id: '18lAP000001Eug5YAC' },
      { devName: 'Acme_User_FAQ_Kav', type: 'DataSemanticSearch', id: '18lAP000001PkyLYAS' },
    ]);
  });

  it('throws a descriptive error for a malformed deploymentOrder', () => {
    const badXml = fixtureXml.replace(
      /<deploymentOrder>.*<\/deploymentOrder>/,
      '<deploymentOrder>not-json</deploymentOrder>',
    );
    expect(() => parseDataKitXml(fixturePath, badXml)).toThrow(/failed to parse deploymentOrder JSON/);
  });
});
