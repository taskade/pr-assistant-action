# pr-assistant-action
This is a GitHub Action that helps out with PRs.

### Features
- PR title verification
- Approval count verification

See (this workflow)[examples/workflow.yml] for an example.

### Publishing
The build process uses both Typescript compiler and ncc.

##### Typescript
Run `yarn build`. The output is stored in `dist/`. This output should not be checked into git.

##### NCC
Run `yarn package`. The output is stored in `lib/`. This output should be checked into git and is the code that will be run by GitHub Actions.

To build, run `yarn build && yarn package` and check in changes to files under `lib/`.
