import * as github from '@actions/github';
import conventionalCommitsParser, { Commit } from 'conventional-commits-parser';

import { Result } from './types';

enum TitleLabel {
  TYPE_MISSING = 'pr/type-missing :question:',
  ISSUE_REFERENCE_MISSING = 'pr/issue-ref-missing :hash:',
  TITLE_NOT_CAPITALISED = 'pr/title-not-capitalised :a:',
  TITLE_HAS_ENDING_PERIOD = 'pr/title-has-ending-period :black_circle:',
  FEAT_FIX_NO_SCOPE = 'pr/feat-fix-no-scope :infinity:',
}

async function validatePRTitle(title: string): Promise<Result> {
  const parser = conventionalCommitsParser();

  const parsed: Commit = await new Promise((resolve, reject) => {
    parser.on('data', resolve);
    parser.on('error', reject);
    parser.write(title);
  });

  const result: Result = {
    labelsToAdd: [],
    labelsToRemove: [],
  };

  // Type
  if (parsed.type == null) {
    result.labelsToAdd.push(TitleLabel.TYPE_MISSING);
  } else {
    result.labelsToRemove.push(TitleLabel.TYPE_MISSING);
  }

  // References
  if (parsed.references.length === 0) {
    result.labelsToAdd.push(TitleLabel.ISSUE_REFERENCE_MISSING);
  } else {
    result.labelsToRemove.push(TitleLabel.ISSUE_REFERENCE_MISSING);
  }

  // Subject
  if (parsed.subject != null) {
    // Capitalisation
    const firstChar = parsed.subject.slice(0, 1);

    if (firstChar !== firstChar.toUpperCase()) {
      result.labelsToAdd.push(TitleLabel.TITLE_NOT_CAPITALISED);
    } else {
      result.labelsToRemove.push(TitleLabel.TITLE_NOT_CAPITALISED);
    }

    // Don't end with period
    const lastChar = parsed.subject.slice(-1);
    if (lastChar === '.') {
      result.labelsToAdd.push(TitleLabel.TITLE_HAS_ENDING_PERIOD);
    } else {
      result.labelsToRemove.push(TitleLabel.TITLE_HAS_ENDING_PERIOD);
    }
  }

  // Changelog-worthy scope
  switch (parsed.type) {
    case 'feat':
    case 'fix': {
      if (parsed.scope == null) {
        result.labelsToAdd.push(TitleLabel.FEAT_FIX_NO_SCOPE);
      } else {
        result.labelsToRemove.push(TitleLabel.FEAT_FIX_NO_SCOPE);
      }
      break;
    }
  }

  return result;
}

export default async function verifyPRTitle(): Promise<Result | null> {
  const prTitle = github.context.payload.pull_request?.title;

  if (
    github.context.payload.action === 'edited' &&
    !('title' in github.context.payload.changes)
  ) {
    console.log('No changes in title, aborting');
    return null;
  }

  return await validatePRTitle(prTitle);
}
