import * as core from '@actions/core';
import * as github from '@actions/github';
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser';

export default async function verifyPRTitle(): Promise<void> {
  const prTitle = github.context.payload.pull_request?.title;

  const prNumber = github.context.payload.pull_request?.number;

  if (prNumber == null) {
    throw new Error(
      'This action can only be triggered from events with pull_request in the payload'
    );
  }

  if (
    github.context.action === 'edited' &&
    github.context.payload.pull_request?.['changes[title][from]'] == null
  ) {
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
