import { readFileSync } from 'node:fs';
import { hasCommentMarker } from './commentBuilder';

interface GithubEventPayload {
  pull_request?: {
    number: number;
    base: { sha: string };
    head: { sha: string };
  };
}

function loadEvent(): GithubEventPayload {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return {};
  return JSON.parse(readFileSync(eventPath, 'utf8')) as GithubEventPayload;
}

export function resolvePullRequestRefs(): { baseRef: string; headRef: string } {
  const event = loadEvent();
  const baseRef = event.pull_request?.base.sha ?? process.env.GITHUB_BASE_REF;
  const headRef = event.pull_request?.head.sha ?? process.env.GITHUB_SHA;
  if (!baseRef || !headRef) {
    throw new Error('Unable to resolve base/head refs from the GitHub Actions pull_request event context');
  }
  return { baseRef, headRef };
}

async function findExistingCommentId(repo: string, prNumber: number, token: string): Promise<number | undefined> {
  const response = await fetch(`https://api.github.com/repos/${repo}/issues/${prNumber}/comments?per_page=100`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) return undefined;
  const comments = (await response.json()) as Array<{ id: number; body: string }>;
  return comments.find((comment) => hasCommentMarker(comment.body))?.id;
}

export async function postComment(body: string): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = loadEvent().pull_request?.number;

  if (!token || !repo || !prNumber) {
    throw new Error('Missing GITHUB_TOKEN, GITHUB_REPOSITORY, or pull_request number in the workflow context');
  }

  const existingCommentId = await findExistingCommentId(repo, prNumber, token);
  const url = existingCommentId
    ? `https://api.github.com/repos/${repo}/issues/comments/${existingCommentId}`
    : `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;

  const response = await fetch(url, {
    method: existingCommentId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  }
}
