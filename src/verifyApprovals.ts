import * as core from '@actions/core';
import * as github from '@actions/github';

import { Result } from './types';

enum ApprovalLabel {
  NEEDS_MORE_REVIEWERS = 'pr/needs-more-reviewers :octocat:',
  SHIP_IT = 'pr/ship_it :shipit:',
}

export default async function verifyApprovals(): Promise<Result | null> {
  const minApprovalCountStr = core.getInput('min_approvals_count');
  const minApprovalCount = parseInt(minApprovalCountStr, 10);

  const result: Result = {
    labelsToAdd: [],
    labelsToRemove: [],
  };

  if (
    github.context.payload.review != null &&
    github.context.payload.review.state === 'commented'
  ) {
    console.log('Event was for a commented review, ignoring');
    return null;
  }

  const token = core.getInput('github_token');

  const octokit = github.getOctokit(token);

  const prNumber = github.context.payload.pull_request!.number;

  const { owner, repo } = github.context.repo;

  const reviewsResponse = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
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

  if (approvalCount >= minApprovalCount) {
    result.labelsToAdd.push(ApprovalLabel.SHIP_IT);
    result.labelsToRemove.push(ApprovalLabel.NEEDS_MORE_REVIEWERS);
  } else {
    result.labelsToAdd.push(ApprovalLabel.NEEDS_MORE_REVIEWERS);
    result.labelsToRemove.push(ApprovalLabel.SHIP_IT);
  }

  return result;
}
