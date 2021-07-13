import * as core from '@actions/core';
import * as github from '@actions/github';
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser';

async function verifyApprovals() {
  const minApprovalCountStr = core.getInput('min_approvals_count');
  const minApprovalCount = parseInt(minApprovalCountStr, 10);

  console.log('minApprovalCount=', minApprovalCount);

  if (
    github.context.payload.review != null &&
    github.context.payload.review.state === 'COMMENTED'
  ) {
    console.log('Event was for a COMMENTED review, ignoring');
    return;
  }

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
  const reviewMap = new Map<number, typeof reviews[0]>();

  for (const review of reviews) {
    const userId = review.user?.id;

    if (userId == null) {
      continue;
    }

    const prevReview = reviewMap.get(userId);

    if (
      prevReview != null &&
      review.submitted_at != null &&
      prevReview.submitted_at != null
    ) {
      const reviewDate = new Date(review.submitted_at);
      const prevReviewDate = new Date(prevReview.submitted_at);

      if (reviewDate.valueOf() > prevReviewDate.valueOf()) {
        reviewMap.set(userId, review);
      }
    } else {
      reviewMap.set(userId, review);
    }
  }

  for (const review of reviewMap.values()) {
    console.log(`Latest review from ${review.user?.login} = ${review.state}`);
  }

  const approvalCount = [...reviewMap.values()].filter(
    (review) => review.state === 'APPROVED'
  ).length;

  console.log('approvalCount=', approvalCount);
  console.log('reviewCount=', reviews.length);

  let body = `${approvalCount}/${minApprovalCount} approvals to merge`;

  if (approvalCount >= minApprovalCount) {
    body = `@${prAuthor} ${minApprovalCount} approvals reached! 🚀🚀🚀🚀🚀`;
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

  if (github.context.payload.pull_request?.['changes[title][from]'] == null) {
    console.log('No changes in title, aborting');
    return;
  }

  const parser = conventionalCommitsParser();
  const parsedTitle: Commit = await new Promise((resolve, reject) => {
    parser.on('data', resolve);
    parser.on('error', reject);
    parser.write(prTitle);
  });

  const hasType = parsedTitle.type != null;
  const hasReferences = parsedTitle.references.length > 0;
  const isCapitalised =
    parsedTitle.subject?.slice?.(0, 1) ===
    parsedTitle.subject?.slice?.(0, 1)?.toUpperCase?.();
  const isEndsWithPeriod = parsedTitle.subject?.slice(-1) === '.';

  const { owner, repo } = github.context.repo;
  const token = core.getInput('github_token');
  const octokit = github.getOctokit(token);

  let body = '';

  if (hasType && hasReferences && isCapitalised && !isEndsWithPeriod) {
    body = 'Excellent PR title! 👍';
  } else {
    body = 'The title of this PR can be improved:\n\n';

    if (!hasType) {
      body += '- Type required (feat, fix, chore, etc.)\n';
    }

    if (!hasReferences) {
      body += '- Reference to issue required (e.g. `feat: add chat (#99)`)\n';
    }

    if (!isCapitalised) {
      body += '- PR Title should begin with a capital letter\n';
    }

    if (isEndsWithPeriod) {
      body += '- PR Title should not end with period\n';
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
