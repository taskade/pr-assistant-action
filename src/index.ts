import * as core from '@actions/core';
import * as github from '@actions/github';

import { Result } from './types';
import verifyApprovals from './verifyApprovals';
import verifyPRTitle from './verifyPRTitle';

async function run() {
  console.log('Processing event', github.context.eventName);
  console.log('Processing action', github.context.payload.action);

  const token = core.getInput('github_token');
  const octokit = github.getOctokit(token);

  const prNumber = github.context.payload.pull_request?.number;

  if (prNumber == null) {
    throw new Error(
      'This action can only be triggered from events with pull_request in the payload'
    );
  }

  let result: Result | null = null;

  switch (github.context.eventName) {
    case 'pull_request': {
      result = await verifyPRTitle();
      break;
    }
    case 'pull_request_review': {
      result = await verifyApprovals();
      break;
    }
  }

  if (result != null) {
    const { owner, repo } = github.context.repo;

    for (const label of result.labelsToRemove) {
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: prNumber,
          name: label,
        });
      } catch (e) {
        console.error(e);
      }
    }

    for (const label of result.labelsToAdd) {
      async function addLabel() {
        await octokit.rest.issues.addLabels({
          owner,
          repo,
          issue_number: prNumber!,
          labels: [label],
        });
      }

      try {
        await addLabel();
        continue;
      } catch (e) {
        console.error(e);
      }

      try {
        // Create label and try again
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: label,
        });

        await addLabel();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

run().catch((error) => {
  core.error(error.message);
});
