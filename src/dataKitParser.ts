import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

export interface DataKitSequenceItem {
  devName: string;
  type: string;
  id?: string;
}

export interface DataKitDefinition {
  filePath: string;
  developerName: string;
  masterLabel: string;
  isAutoSequence: boolean;
  sequence: DataKitSequenceItem[];
}

const DATA_KIT_FILE_PATTERN = /dataPackageKitDefinitions\/[^/]+\.dataPackageKitDefinition-meta\.xml$/;

export function isDataKitDefinitionFile(filePath: string): boolean {
  return DATA_KIT_FILE_PATTERN.test(filePath);
}

export function filterDataKitFiles(filePaths: string[]): string[] {
  return filePaths.filter(isDataKitDefinitionFile);
}

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });

export function parseDataKitXml(filePath: string, xmlContent: string): DataKitDefinition {
  const parsed = parser.parse(xmlContent);
  const definition = parsed?.DataPackageKitDefinition;
  if (!definition) {
    throw new Error(`${filePath} is not a valid DataPackageKitDefinition metadata file`);
  }

  const rawDeploymentOrder: string | undefined = definition.deploymentOrder;
  const base = {
    filePath,
    developerName: definition.developerName ?? '',
    masterLabel: definition.masterLabel ?? '',
  };

  if (!rawDeploymentOrder) {
    return { ...base, isAutoSequence: false, sequence: [] };
  }

  let deploymentOrder: { isAutoSequence?: boolean; sequence?: DataKitSequenceItem[] };
  try {
    deploymentOrder = JSON.parse(rawDeploymentOrder);
  } catch (error) {
    throw new Error(`${filePath}: failed to parse deploymentOrder JSON - ${(error as Error).message}`);
  }

  return {
    ...base,
    isAutoSequence: Boolean(deploymentOrder.isAutoSequence),
    sequence: deploymentOrder.sequence ?? [],
  };
}

export function parseDataKitFile(filePath: string): DataKitDefinition {
  return parseDataKitXml(filePath, readFileSync(filePath, 'utf8'));
}
