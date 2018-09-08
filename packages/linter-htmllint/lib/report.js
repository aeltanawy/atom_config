'use babel';

import { shell } from 'electron'; // eslint-disable-line import/extensions, import/no-extraneous-dependencies, import/no-unresolved
import htmllint from 'htmllint';

import metadata from '../package.json';

// Internal variables
const ignored = [];

// Internal functions
async function findSimilarIssue(issueTitle) {
  const repo = metadata.repository.url.replace(/https?:\/\/(\d+\.)?github\.com\//gi, '');
  const query = encodeURIComponent(`repo:${repo} is:open in:title ${issueTitle}`);
  const githubHeaders = new Headers({
    accept: 'application/vnd.github.v3+json',
    contentType: 'application/json'
  });

  let data = [];
  try {
    const response = await fetch(`https://api.github.com/search/issues?q=${query}&sort=created&order=asc`, { headers: githubHeaders });
    if (!response.ok) {
      return null;
    }

    data = await response.json();
    if (data === null || data.items === undefined) {
      return null;
    }

    if (data.items.length === 0) {
      return null;
    }

    const issue = data.items[0];
    if (issue.title.includes(issueTitle)) {
      return `${metadata.repository.url}/issues/${issue.number}`;
    }
  } catch (error) {
    // eslint-disable no-empty
  }

  return null;
}

export default async function report(issue, error) {
  const range = `(${issue.line - 1}:${issue.column - 1})`;
  const reason = htmllint.messages.renderIssue(issue);
  const titleText = `Invalid position given by rule '${issue.code}'`;

  if (ignored.includes(titleText)) {
    return;
  }
  ignored.push(titleText);

  const ghIssue = await findSimilarIssue(titleText);
  const notification = atom.notifications.addWarning('Unexpected issue with htmllint', {
    description: [
      `Original message: ${issue.code} - ${reason} ${range}`,
      ghIssue === null ? '' : 'This issue has already been reported'
    ].join('\n\n'),
    dismissable: true,
    buttons: [
      {
        text: ghIssue === null ? 'Report' : 'View issue',
        onDidClick: () => {
          if (ghIssue !== null) {
            shell.openExternal(ghIssue);
          } else {
            const title = encodeURIComponent(titleText);
            const body = encodeURIComponent([
              'htmlhint returned a point that did not exist in the document being edited.',
              '',
              'Debug information:',
              `- Code: \`${issue.code}\``,
              `- Rule: \`${reason}\``,
              `- Range: \`${range}\``,
              `- Error: \`${error.toString()}\``,
              '',
              '<!-- If at all possible, please include code to reproduce this issue! -->'
            ].join('\n'));

            shell.openExternal(`${metadata.repository.url}/issues/new?title=${title}&body=${body}`);
          }

          notification.dismiss();
        }
      }
    ]
  });
}
