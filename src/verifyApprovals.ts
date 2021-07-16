import * as core from '@actions/core';
import * as github from '@actions/github';

export default async function verifyApprovals(): Promise<void> {
  const minApprovalCountStr = core.getInput('min_approvals_count');
  const minApprovalCount = parseInt(minApprovalCountStr, 10);

  console.log('minApprovalCount=', minApprovalCount);

  if (
    github.context.payload.review != null &&
    github.context.payload.review.state === 'commented'
  ) {
    console.log('Event was for a commented review, ignoring');
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

    console.log(
      `Processing review from ${review.user?.login} at ${review.submitted_at}`
    );

    if (userId == null) {
      continue;
    }

    if (!reviewMap.has(userId)) {
      reviewMap.set(userId, review);
    } else {
      const prevReview = reviewMap.get(userId)!;

      if (review.submitted_at != null && prevReview.submitted_at != null) {
        const reviewDate = new Date(review.submitted_at);
        const prevReviewDate = new Date(prevReview.submitted_at);

        if (reviewDate.valueOf() > prevReviewDate.valueOf()) {
          reviewMap.set(userId, review);
        }
      }
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

  let body = '';

  if (approvalCount >= minApprovalCount) {
    body = `🚀🚀🚀🚀🚀 @${prAuthor} ${minApprovalCount} approvals reached!`;
  } else {
    body = `💁 ${approvalCount}/${minApprovalCount} approvals to merge\n\n`;

    body += '| Reviewer | Status |\n';
    body += '| -------- | ------ |\n';

    for (const review of reviewMap.values()) {
      body += `| ${review.user?.login} | ${review.state} |\n`;
    }
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
}
