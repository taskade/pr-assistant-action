import * as core from '@actions/core';
import * as github from '@actions/github';
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser';

async function validatePRTitle(title: string) {
  const parser = conventionalCommitsParser();

  const parsed: Commit = await new Promise((resolve, reject) => {
    parser.on('data', resolve);
    parser.on('error', reject);
    parser.write(title);
  });

  const info: string[] = [];
  const errors: string[] = [];

  // Type
  if (parsed.type == null) {
    errors.push('Type required (feat, fix, chore, etc.)');
  }

  // References
  if (parsed.references.length === 0) {
    errors.push('Reference to issue required (e.g. `feat: Add chat (#99)`)');
  }

  // Subject
  if (parsed.subject != null) {
    // Capitalisation
    const firstChar = parsed.subject.slice(0, 1);

    if (firstChar !== firstChar.toUpperCase()) {
      errors.push(
        'PR title should begin with a capital letter (e.g. `feat: Add chat (#99)` instead of `feat: add chat (#99)`)'
      );
    }

    // Don't end with period
    const lastChar = parsed.subject.slice(-1);
    if (lastChar === '.') {
      errors.push(
        'PR title should not end with period. (e.g. `feat: Add chat (#99)` instead of `feat: Add chat. (#99)`)'
      );
    }
  }

  // Changelog-worthy scope
  switch (parsed.type) {
    case 'feat':
    case 'fix': {
      info.push(
        `As your PR is typed as \`${parsed.type}\`, it will be included in the changelog.`
      );

      if (parsed.scope == null) {
        info.push(
          'Consider adding a scope to the PR title (e.g. `feat(chat): Add formatting (#99)`)'
        );
      }
      break;
    }
  }

  return { info, errors };
}

export default async function verifyPRTitle(): Promise<void> {
  const prTitle = github.context.payload.pull_request?.title;

  const prNumber = github.context.payload.pull_request?.number;

  if (prNumber == null) {
    throw new Error(
      'This action can only be triggered from events with pull_request in the payload'
    );
  }

  console.log('payload', github.context.payload);

  if (
    github.context.payload.action === 'edited' &&
    !('title' in github.context.payload.changes)
  ) {
    console.log('No changes in title, aborting');
    return;
  }

  const { info, errors } = await validatePRTitle(prTitle);

  const { owner, repo } = github.context.repo;
  const token = core.getInput('github_token');
  const octokit = github.getOctokit(token);

  let body = '';

  if (errors.length === 0) {
    body = '💯 Excellent PR title!';
  } else {
    body = '😞 The title of this PR can be improved:\n\n';

    for (const error of errors) {
      body += `- ${error}\n`;
    }
  }

  if (info.length > 0) {
    body +=
      '\n\n💁 Additional information is available about your PR title:\n\n';

    for (const text of info) {
      body += `- ${text}\n`;
    }
  }

  if (errors.length > 0 || info.length > 0) {
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
