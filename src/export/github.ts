// Getting the README onto the user's profile without asking for any GitHub
// permissions: we copy the text and open the right page on github.com. Which page is
// right depends on whether their profile repo and its README exist yet, which the
// public API can tell us without logging in.

const USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(value: string): boolean {
  return USERNAME.test(value);
}

/** Accepts "octocat", "@octocat" or a pasted profile URL. */
export function normalizeUsername(input: string): string {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/github\.com\/([^/?#\s]+)/i);
  return (fromUrl ? fromUrl[1] : trimmed).replace(/^@/, '');
}

export type ProfileStatus =
  | { kind: 'has-readme'; branch: string; path: string }
  | { kind: 'no-readme'; branch: string }
  | { kind: 'no-repo' }
  | { kind: 'unknown' };

export function profileRepoUrl(user: string): string {
  return `https://github.com/${user}/${user}`;
}

export function editReadmeUrl(user: string, branch = 'HEAD', path = 'README.md'): string {
  return `${profileRepoUrl(user)}/edit/${branch}/${path}`;
}

export function newReadmeUrl(user: string, branch = 'main'): string {
  return `${profileRepoUrl(user)}/new/${branch}?filename=README.md`;
}

export function createRepoUrl(user: string): string {
  return `https://github.com/new?name=${encodeURIComponent(user)}&visibility=public`;
}

/** Where step 2 sends the user: edit the README, add one, or first create the repo. */
export function openUrl(user: string, status: ProfileStatus): string {
  switch (status.kind) {
    case 'has-readme':
      return editReadmeUrl(user, status.branch, status.path);
    case 'no-readme':
      return newReadmeUrl(user, status.branch);
    case 'no-repo':
      return createRepoUrl(user);
    case 'unknown':
      return editReadmeUrl(user);
  }
}

export async function lookupProfile(user: string, fetchFn: typeof fetch = fetch): Promise<ProfileStatus> {
  const api = `https://api.github.com/repos/${user}/${user}`;
  const headers = { Accept: 'application/vnd.github+json' };
  try {
    const repo = await fetchFn(api, { headers });
    if (repo.status === 404) return { kind: 'no-repo' };
    if (!repo.ok) return { kind: 'unknown' };
    const { default_branch: branch } = (await repo.json()) as { default_branch: string };

    const readme = await fetchFn(`${api}/readme`, { headers });
    if (readme.status === 404) return { kind: 'no-readme', branch };
    if (!readme.ok) return { kind: 'unknown' };
    const { path } = (await readme.json()) as { path: string };
    // The API also finds READMEs in docs/ or .github/, but only the root one shows on the profile.
    return path.includes('/') ? { kind: 'no-readme', branch } : { kind: 'has-readme', branch, path };
  } catch {
    // Offline, blocked, or rate limited: fall back to the most common case.
    return { kind: 'unknown' };
  }
}
