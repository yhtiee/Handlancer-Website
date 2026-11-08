# Email

All email is sent by Resend from `notifications@handlancer.com`, with replies going to
`support@handlancer.com`. The domain is verified in Resend.

| Piece | What it does |
| --- | --- |
| `functions/send-auth-email` | Supabase Auth's Send Email hook: confirmation codes, password resets, security notices |
| `functions/send-email` | Product events, posted by Postgres through pg_net |
| `functions/_shared/email` | The templates (`templates.ts`) and the one HTML shell (`render.ts`) |
| `email_delivery.sql` | `dispatch_email()`, the triggers, and the `email_log` table |

To change wording, edit `templates.ts`, run `npm test`, and redeploy both functions.

## Every email

| Flow | Email | Goes to | Triggered by |
| --- | --- | --- | --- |
| Sign-up | Confirm your email (code and link) | New user | Auth hook |
| Forgot password | Reset link | User | Auth hook |
| Password changed | Security notice | User | Auth hook |
| Email change, invite, magic link, reauthentication | Handled for completeness; the app has no screen for these yet | User | Auth hook |
| Profile created | Welcome (customer or artisan version) | User | `profiles` insert |
| Waitlist | You're on the list | Submitted address | `waitlist` insert |
| Artisan submits | Application received | Artisan | `provider_status` to pending |
| Artisan submits | Application to review | Support | `provider_status` to pending |
| Artisan reviewed | Approved, changes needed, suspended | Artisan | `notifications` |
| Job posted | New job near you, to approved artisans with a matching trade and area, at most one an hour each. Off until `JOB_ALERTS_ENABLED=true` | Artisans | `jobs` insert |
| Direct hire | A customer asked for you | Artisan | `jobs` insert |
| Quote sent | New quote | Customer | `notifications` |
| Another quote chosen | Not this time | Artisan | `quotes.status` to rejected |
| Hired | You were hired | Artisan | `notifications` |
| Hired | Money held in escrow | Customer | `escrow_hold` transaction |
| Materials | Requested | Customer | `notifications` |
| Materials | Released | Artisan | `notifications` |
| Work finished | Check the work | Customer | `notifications` |
| Final payment | You've been paid | Artisan | `notifications` |
| Review left | New review | Artisan | `notifications` |
| Chat | New message, at most one per conversation per 30 minutes | Recipient | `notifications` |
| Dispute opened | Receipt | Reporter | `disputes` insert |
| Dispute opened | Payment on hold, without the allegation | Artisan | `notifications` |
| Dispute opened | Dispute details | Support | `disputes` insert |
| Dispute settled | Outcome | Both sides | `notifications` |
| Wallet | Top-up arrived | Owner | `fund` transaction |
| Wallet | Withdrawal requested, paid, failed | Owner | `withdraw` transaction |
| Security | PIN set or changed, wallet locked, payout account changed | Owner | `wallet_security` |
| Account deleted | Confirmation | Former owner | `profiles.deleted_at` |

People can turn off job alerts, messages, and quote and review emails in Settings
(`email_preferences`). Everything else always sends. Withdrawals are settled by hand under
Transactions in the admin console.

## Secrets

Set on the project with `supabase secrets set`: `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET`
(`v1,whsec_...`, also configured on the Auth hook), and `EMAIL_HOOK_SECRET`.

`EMAIL_HOOK_SECRET` must match the Vault secret `email_hook_secret`. Vault also holds
`email_hook_url`. Until both are present the triggers do nothing.

```sql
select vault.create_secret('https://ukwotktmqacrpworudui.supabase.co/functions/v1/send-email', 'email_hook_url');
select vault.create_secret('<same value as EMAIL_HOOK_SECRET>', 'email_hook_secret');
```

## Deploying

```bash
npx supabase functions deploy send-email send-auth-email \
  --remote=ukwotktmqacrpworudui --no-verify-jwt --use-api
```

Both need `--no-verify-jwt`: neither caller has a user JWT, and each function checks its own secret.

## Order matters when going live

1. Auth's site URL must be `https://www.handlancer.com`, with the site on the redirect allow-list.
2. Deploy the website first. Confirmation and reset links land on `/app/confirm-email` and `/app/reset-password`.
3. Only then turn on **Confirm email** in Auth.

## Checking delivery

```sql
select created_at, event, status, detail from email_log order by created_at desc limit 50;
```

`email_log` holds no addresses. Auth emails aren't logged there, so check them in the Resend
dashboard and the `send-auth-email` function logs.
