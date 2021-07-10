import * as core from '@actions/core';
import * as github from '@actions/github';
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser';

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

  const prAuthor = github.context.payload.pull_request?.user?.login ?? '';

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

  let body = `@${prAuthor} ${minApprovalCount} approvals reached! 🚀🚀🚀🚀🚀`;

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

async function verifyPRTitle() {
  const prTitle = github.context.payload.pull_request?.title;

  const prNumber = github.context.payload.pull_request?.number;

  if (prNumber == null) {
    throw new Error(
      'This action can only be triggered from events with pull_request in the payload'
    );
  }

  const parser = conventionalCommitsParser();
  const parsedTitle: Commit = await new Promise((resolve, reject) => {
    parser.on('data', resolve);
    parser.on('error', reject);
    parser.write(prTitle);
  });

  const hasType = parsedTitle.type != null;
  const hasReferences = parsedTitle.references.length > 0;

  const { owner, repo } = github.context.repo;
  const token = core.getInput('github_token');
  const octokit = github.getOctokit(token);

  let body = '';

  if (hasType && hasReferences) {
    body = 'Excellent PR title! 👍';
  } else {
    body = 'The title of this PR can be improved:\n\n';

    if (!hasType) {
      body += '- Type required (feat, fix, chore, etc.)\n';
    }

    if (!hasReferences) {
      body += '- Reference to issue required (e.g. #99)\n';
    }

    body +=
      '\n\n[Conventional Commits 1.0.0 Specification](https://www.conventionalcommits.org/en/v1.0.0/#summary)';
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
