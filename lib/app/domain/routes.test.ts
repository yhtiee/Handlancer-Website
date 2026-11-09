import assert from 'node:assert/strict';
import { test } from 'node:test';

import { onboardingPath, routes, safeNext } from '@/lib/app/domain/routes';

const id = '3f2a8c10-5b7e-4d21-9a33-0c1e2f4a5b6c';
const job = `/app/jobs/new?provider=${id}`;

/** The query string a screen would read off a URL. */
const params = (url: string) => new URL(url, 'https://x.co').searchParams;

test('hire from a shared profile signs up as a client and returns to the job request', () => {
  const link = params(routes.hireFromShare(id));
  assert.equal(link.get('role'), 'user');
  assert.equal(safeNext(link.get('next'), '/app'), job);
});

test('the destination survives onboarding', () => {
  const link = params(onboardingPath('user', job));
  assert.equal(link.get('role'), 'user');
  assert.equal(link.get('next'), job);
});

test('onboarding drops a destination that leaves the app', () => {
  for (const evil of ['https://evil.example', '//evil.example', '/app\\evil']) {
    assert.equal(onboardingPath('user', evil), '/app/onboarding?role=user');
  }
});

test('plain onboarding stays plain', () => {
  assert.equal(onboardingPath(null, null), '/app/onboarding');
});
