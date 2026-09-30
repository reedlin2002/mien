import { describe, expect, it } from 'vitest';
import { isValidUsername, lookupProfile, normalizeUsername, openUrl } from './github';

function fakeFetch(routes: Record<string, [number, unknown?]>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const [status, body] = routes[String(input)] ?? [500];
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  }) as typeof fetch;
}

const REPO = 'https://api.github.com/repos/octo/octo';

describe('usernames', () => {
  it('accepts what GitHub accepts', () => {
    expect(isValidUsername('octo-cat')).toBe(true);
    expect(isValidUsername('-octo')).toBe(false);
    expect(isValidUsername('octo--cat')).toBe(false);
    expect(isValidUsername('a'.repeat(40))).toBe(false);
  });

  it('pulls the name out of what people paste', () => {
    expect(normalizeUsername(' @octo ')).toBe('octo');
    expect(normalizeUsername('https://github.com/octo?tab=repositories')).toBe('octo');
  });
});

describe('lookupProfile', () => {
  it('finds an existing README', async () => {
    const status = await lookupProfile(
      'octo',
      fakeFetch({ [REPO]: [200, { default_branch: 'master' }], [`${REPO}/readme`]: [200, { path: 'readme.md' }] })
    );
    expect(status).toEqual({ kind: 'has-readme', branch: 'master', path: 'readme.md' });
    expect(openUrl('octo', status)).toBe('https://github.com/octo/octo/edit/master/readme.md');
  });

  it('sends people without a profile repo to create one', async () => {
    const status = await lookupProfile('octo', fakeFetch({ [REPO]: [404] }));
    expect(openUrl('octo', status)).toBe('https://github.com/new?name=octo&visibility=public');
  });

  it('ignores READMEs outside the repo root', async () => {
    const status = await lookupProfile(
      'octo',
      fakeFetch({ [REPO]: [200, { default_branch: 'main' }], [`${REPO}/readme`]: [200, { path: '.github/README.md' }] })
    );
    expect(openUrl('octo', status)).toBe('https://github.com/octo/octo/new/main?filename=README.md');
  });

  it('falls back to the edit page when the API is unavailable', async () => {
    const status = await lookupProfile('octo', fakeFetch({ [REPO]: [403] }));
    expect(openUrl('octo', status)).toBe('https://github.com/octo/octo/edit/HEAD/README.md');
  });
});
