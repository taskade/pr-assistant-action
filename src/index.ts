import * as core from '@actions/core';
import * as github from '@actions/github';

import verifyApprovals from './verifyApprovals';
import verifyPRTitle from './verifyPRTitle';

async function run() {
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
