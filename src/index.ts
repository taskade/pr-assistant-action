import * as core from '@actions/core';
import * as github from '@actions/github';

import verifyApprovals from './verifyApprovals';
import verifyPRTitle from './verifyPRTitle';

async function run() {
  console.log('Processing event', github.context.eventName);
  console.log('Processing action', github.context.payload.action);

  switch (github.context.eventName) {
    case 'pull_request': {
      await verifyPRTitle();
      break;
    }
    case 'pull_request_review': {
      await verifyApprovals();
      break;
    }
  }
}

run().catch((error) => {
  core.error(error.message);
});
