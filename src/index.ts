#!/usr/bin/env node
import { getChangedFiles } from './git';
import { filterDataKitFiles, parseDataKitFile } from './dataKitParser';
import { buildComment } from './commentBuilder';
import { postComment, resolvePullRequestRefs } from './github';

async function main(): Promise<void> {
  const { baseRef, headRef } = resolvePullRequestRefs();
  const changedFiles = getChangedFiles(baseRef, headRef);
  const dataKitFiles = filterDataKitFiles(changedFiles);

  if (dataKitFiles.length === 0) {
    console.log('No data package kit definition files changed in this PR.');
    return;
  }

  const kits = dataKitFiles.map((filePath) => parseDataKitFile(filePath));
  const comment = buildComment(kits);
  await postComment(comment);
  console.log(`Posted deployment order comment for ${dataKitFiles.length} data kit(s).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
