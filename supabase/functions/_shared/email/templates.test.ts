import assert from 'node:assert/strict';
import test from 'node:test';

import { render } from './render.ts';
import { authEmail, productEmail, PRODUCT_EVENTS, type AuthAction } from './templates.ts';

const appUrl = 'https://www.handlancer.com';
const jobId = '3f2a8c10-5b7e-4d21-9a33-0c1e2f4a5b6c';
const hostile = '<img src=x onerror=alert(1)>"';

test('every product event renders html and text', () => {
  for (const event of PRODUCT_EVENTS) {
    const email = productEmail({ event, appUrl, name: 'Tolu Adeyemi', data: { job_id: jobId, title: 'Fix the tap', amount: 15000, rating: 5 } });
    assert.ok(email, event);
    const { html, text } = render(email, appUrl);
    assert.match(html, /HandLancer/, event);
    assert.ok(text.length > 20, event);
    assert.doesNotMatch(html + text, /undefined|\[object|NaN/, event);
  }
});

test('an unknown event has no template', () => {
  assert.equal(productEmail({ event: 'nope', appUrl, data: {} }), null);
});

test('user-written strings cannot inject markup', () => {
  for (const event of ['quote_received', 'message', 'artisan_changes_requested', 'admin_dispute_opened']) {
    const email = productEmail({ event, appUrl, data: { title: hostile, preview: hostile, note: hostile, reason: hostile } });
    const { html } = render(email!, appUrl);
    assert.ok(!html.includes('<img src=x'), event);
    assert.ok(html.includes('&lt;img src=x'), event);
  }
});

test('a malformed id never reaches a link', () => {
  const email = productEmail({ event: 'hired', appUrl, data: { job_id: '../../evil', title: 'x' } });
  assert.equal(email!.cta!.url, `${appUrl}/app/jobs`);
});

test('the waitlist email carries nothing the submitter typed', () => {
  const { html, text } = render(productEmail({ event: 'waitlist_joined', appUrl, name: 'BUY CRYPTO', data: { role: 'user', city: 'BUY CRYPTO' } })!, appUrl);
  assert.ok(!(html + text).includes('BUY CRYPTO'));
});

test('a waitlist invitation links to onboarding for that role', () => {
  const artisan = productEmail({ event: 'waitlist_invite', appUrl, data: { role: 'provider' } })!;
  assert.equal(artisan.cta!.url, `${appUrl}/app/sign-in?role=provider`);
  const customer = productEmail({ event: 'waitlist_invite', appUrl, data: { role: 'user' } })!;
  assert.equal(customer.cta!.url, `${appUrl}/app/sign-in?role=user`);
  assert.notEqual(artisan.subject, customer.subject);
});

test('a provider dispute email leaves out the allegation', () => {
  const { html } = render(productEmail({ event: 'dispute_opened', appUrl, data: { title: 'Job', reference: 'HL-1', reason: 'he stole it' } })!, appUrl);
  assert.ok(!html.includes('he stole it'));
});

test('auth emails link to the right screens', () => {
  const base = { appUrl, token: '123456', tokenHash: 'pkce_abc' };
  const signup = authEmail({ ...base, action: 'signup', next: '/app/onboarding?role=provider' });
  const url = new URL(signup.cta!.url);
  assert.equal(url.pathname, '/app/confirm-email');
  assert.equal(url.searchParams.get('token_hash'), 'pkce_abc');
  assert.equal(url.searchParams.get('next'), '/app/onboarding?role=provider');
  assert.match(render(signup, appUrl).text, /123456/);

  const recovery = new URL(authEmail({ ...base, action: 'recovery' }).cta!.url);
  assert.equal(recovery.pathname, '/app/reset-password');
  assert.equal(recovery.searchParams.get('type'), 'recovery');
});

test('only optional emails offer a way to turn them off', () => {
  const data = { job_id: jobId, title: 'x', amount: 1 };
  for (const event of ['message', 'quote_received', 'quote_not_selected', 'review', 'job_alert']) {
    assert.ok(productEmail({ event, appUrl, data })!.manageUrl, event);
  }
  for (const event of ['hired', 'payout', 'bank_changed', 'pin_locked', 'dispute_opened', 'withdrawal_failed']) {
    assert.equal(productEmail({ event, appUrl, data })!.manageUrl, undefined, event);
  }
});

test('a failed withdrawal says the money came back', () => {
  const { text } = render(productEmail({ event: 'withdrawal_failed', appUrl, data: { amount: 5000 } })!, appUrl);
  assert.match(text, /back in your HandLancer wallet/);
});

test('an open budget is not shown as zero naira', () => {
  const { text } = render(productEmail({ event: 'job_alert', appUrl, data: { job_id: jobId, title: 'x', budget: null } })!, appUrl);
  assert.match(text, /Budget: Open/);
});

test('every auth action renders', () => {
  const actions: AuthAction[] = ['signup', 'recovery', 'invite', 'magiclink', 'email_change', 'email_change_current', 'email_change_new', 'reauthentication', 'password_changed_notification', 'email_changed_notification'];
  for (const action of actions) {
    const { html } = render(authEmail({ action, appUrl, token: '123456', tokenHash: 'h', newEmail: 'new@example.com' }), appUrl);
    assert.doesNotMatch(html, /undefined/, action);
  }
});
