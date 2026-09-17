# SF DataKit Parser

A GitHub Action that watches pull requests for changes to Salesforce
`*.dataPackageKitDefinition-meta.xml` files (e.g.
`force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml`),
decodes the `deploymentOrder` JSON property, and posts the decomposed metadata
sequence (dev name / type / id) as a comment on the pull request.

If a comment from a previous run already exists on the PR, it's updated in
place instead of duplicated.

## Usage

```yaml
name: Data Kit PR Comment
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  pull-requests: write
  contents: read

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # full history needed to diff base...head

      - uses: <owner>/sf-datakit-parsing-action@v1
        # github-token input defaults to ${{ github.token }}; override if you
        # need a PAT with broader permissions.
```

### Example output

For a data kit like:

```xml
<deploymentOrder>{"isAutoSequence":true,"sequence":[{"devName":"Acme_Knowledge_Article","type":"DataStream"},{"devName":"Acme_UserFAQ_Kav1","type":"DataSemanticSearch","id":"18lAP000001Eug5YAC"}]}</deploymentOrder>
```

the action posts:

> ## Data Package Kit deployment order
>
> ### Acme - Sample V1 (`force-app/main/default/dataPackageKitDefinitions/Acme_Sample_V1.dataPackageKitDefinition-meta.xml`)
>
> Auto sequence: yes
>
> | # | Dev Name | Type | Id |
> | - | -------- | ---- | -- |
> | 1 | Acme_Knowledge_Article | DataStream | |
> | 2 | Acme_UserFAQ_Kav1 | DataSemanticSearch | 18lAP000001Eug5YAC |

## Development

```bash
npm install
npm run typecheck
npm test
npm run build   # bundles src/index.ts -> dist/index.js (esbuild, includes dependencies)
```

`dist/index.js` must be committed and kept up to date before tagging a
release — GitHub Actions does not run `npm install` for a composite action,
it runs the committed bundle directly.

## Publishing a release

1. `npm run build` and commit the updated `dist/index.js`.
2. Tag a release (e.g. `v1.0.0`) and push a matching major version tag
   (`v1`) that consumers pin to in `uses: <owner>/sf-datakit-parsing-action@v1`.
3. Publish the release on GitHub and check "Publish this Action to the
   GitHub Marketplace" — requires the repo to be public and have a `LICENSE`
   file (already included).

## Extending to other metadata types

`src/dataKitParser.ts` only knows about `DataPackageKitDefinition`. To support
another metadata type that should also get its content decomposed into a PR
comment, add a sibling parser module and wire it into `src/index.ts` alongside
`filterDataKitFiles`/`parseDataKitFile`.
