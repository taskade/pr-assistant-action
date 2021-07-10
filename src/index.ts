import * as core from '@actions/core';
import github from '@actions/github';

async function verifyApprovals() {
  const minApprovalCountStr = core.getInput('min-approval-count');
  const minApprovalCount = parseInt(minApprovalCountStr, 10);

  const token = core.getInput('github_token');

  const octokit = github.getOctokit(token);

  const prNumber = github.context.payload.pull_request?.number;

  if (prNumber == null) {
    throw new Error(
      'This action can only be triggered from events with pull_request in the payload'
    );
  }

  const { owner, repo } = github.context.repo;

  const reviewsResponse = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber,
  });

  const reviews = reviewsResponse.data;
  const approvalCount = reviews.filter(
    (review) => review.state === 'approved'
  ).length;

  let body = `${minApprovalCount} approvals reached! 🚀🚀🚀🚀🚀`;

  if (approvalCount < minApprovalCount) {
    body = `${approvalCount}/${minApprovalCount} approvals to merge`;
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}

async function run() {
  switch (github.context.eventName) {
    case 'pull_request': {
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
