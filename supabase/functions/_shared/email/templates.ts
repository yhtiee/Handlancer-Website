/**
 * What every HandLancer email says. Two families:
 *
 *   authEmail()    — Supabase Auth's messages, through the send-auth-email hook.
 *   productEmail() — everything else, through the send-email function. Events
 *                    are the `notifications.type` values plus the ones listed
 *                    in supabase/email_delivery.sql.
 *
 * Pure functions with no Deno or Node APIs, so `npm test` can run them.
 * The in-app wording lives in lib/app/domain/notification-copy.ts; an Edge
 * Function cannot import it, so keep the facts here in step with it.
 *
 * The dispute emails to the provider deliberately leave out what was alleged,
 * for the same reason the push copy does (mobile migration 0020): that is for
 * support to relay once they have heard both sides.
 */
import type { Block, Email } from './render.ts';

export const SITE_URL = 'https://www.handlancer.com';
const LINK_EXPIRY = 'It works once and expires in 1 hour.';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Data = Record<string, unknown>;

function naira(value: unknown): string {
  return `₦${Number(value ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

/** Ids reach URLs only if they are really ids. */
function idOrNull(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null;
}

// ─────────────────────────── Auth ───────────────────────────

export type AuthAction =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'magiclink'
  | 'email_change'
  | 'email_change_current'
  | 'email_change_new'
  | 'reauthentication'
  | 'password_changed_notification'
  | 'email_changed_notification';

export type AuthInput = {
  action: AuthAction;
  appUrl: string;
  token?: string;
  tokenHash?: string;
  /** Same-app path to land on afterwards. */
  next?: string;
  /** New address, for email-change copy. */
  newEmail?: string;
};

function confirmLink({ appUrl, tokenHash, next }: AuthInput, type: string): string {
  const params = new URLSearchParams({ token_hash: tokenHash ?? '', type });
  if (next) params.set('next', next);
  return `${appUrl}/app/confirm-email?${params}`;
}

export function authEmail(input: AuthInput): Email {
  const { action, appUrl, token } = input;
  const codeBlock: Block[] = token ? [{ kind: 'code', code: token }] : [];
  const notYou = 'Didn’t ask for this? You can ignore this email and nothing will change.';

  switch (action) {
    case 'signup':
      return {
        subject: token ? `${token} is your HandLancer code` : 'Confirm your email for HandLancer',
        preheader: 'One step left before you can set up your account.',
        tag: 'Account',
        heading: 'Confirm your',
        emphasis: 'email',
        blocks: [
          { kind: 'p', text: `Enter this code on the HandLancer screen you just left, or use the button. ${LINK_EXPIRY}` },
          ...codeBlock,
          { kind: 'fine', text: 'Didn’t create a HandLancer account? Ignore this email and no account will be set up.' },
        ],
        cta: { label: 'Confirm my email', url: confirmLink(input, 'signup') },
        showLink: true,
        footnote: 'You’re getting this because this address was used to sign up for HandLancer.',
      };
    case 'recovery': {
      const params = new URLSearchParams({ token_hash: input.tokenHash ?? '', type: 'recovery' });
      return {
        subject: 'Reset your HandLancer password',
        preheader: 'Use this link to choose a new password.',
        tag: 'Security',
        heading: 'Choose a new',
        emphasis: 'password',
        blocks: [
          { kind: 'p', text: `Someone asked to reset the password on this account. If that was you, use the button to choose a new one. ${LINK_EXPIRY}` },
          { kind: 'fine', text: 'Didn’t ask for this? You can ignore this email. Your password stays the same until the link is used.' },
        ],
        cta: { label: 'Reset my password', url: `${appUrl}/app/reset-password?${params}` },
        showLink: true,
      };
    }
    case 'invite':
      return {
        subject: 'You’ve been invited to HandLancer',
        preheader: 'Accept the invitation to set up your account.',
        tag: 'Account',
        heading: 'You’re',
        emphasis: 'invited',
        blocks: [{ kind: 'p', text: `Use the button to accept and set up your HandLancer account. ${LINK_EXPIRY}` }],
        cta: { label: 'Accept invitation', url: confirmLink(input, 'invite') },
        showLink: true,
      };
    case 'magiclink':
      return {
        subject: 'Your HandLancer sign-in link',
        preheader: 'Use this link to sign in.',
        tag: 'Security',
        heading: 'Sign in to',
        emphasis: 'HandLancer',
        blocks: [
          { kind: 'p', text: `Use the button to sign in, or enter this code. ${LINK_EXPIRY}` },
          ...codeBlock,
          { kind: 'fine', text: notYou },
        ],
        cta: { label: 'Sign in', url: confirmLink(input, 'magiclink') },
        showLink: true,
      };
    case 'email_change':
    case 'email_change_new':
      return {
        subject: 'Confirm your new HandLancer email',
        preheader: 'Confirm this address to finish changing it.',
        tag: 'Security',
        heading: 'Confirm your new',
        emphasis: 'email',
        blocks: [
          { kind: 'p', text: `Confirm this address to use it for your HandLancer account. ${LINK_EXPIRY}` },
          ...codeBlock,
          { kind: 'fine', text: notYou },
        ],
        cta: { label: 'Confirm new email', url: confirmLink(input, 'email_change') },
        showLink: true,
      };
    case 'email_change_current':
      return {
        subject: 'Approve changing your HandLancer email',
        preheader: 'Someone asked to change the email on this account.',
        tag: 'Security',
        heading: 'Approve this',
        emphasis: 'change',
        blocks: [
          { kind: 'p', text: `Someone asked to move this account to ${input.newEmail ?? 'a new address'}. Approve it only if that was you. ${LINK_EXPIRY}` },
          ...codeBlock,
          { kind: 'fine', text: 'Wasn’t you? Don’t use this link, and reset your password as soon as you can.' },
        ],
        cta: { label: 'Approve change', url: confirmLink(input, 'email_change') },
        showLink: true,
      };
    case 'reauthentication':
      return {
        subject: token ? `${token} is your HandLancer security code` : 'Your HandLancer security code',
        preheader: 'Enter this code to confirm it’s you.',
        tag: 'Security',
        heading: 'Confirm it’s',
        emphasis: 'you',
        blocks: [
          { kind: 'p', text: 'Enter this code to finish what you were doing. It works once and expires in 1 hour.' },
          ...codeBlock,
          { kind: 'fine', text: 'Didn’t ask for this? Someone may have your password, so reset it as soon as you can.' },
        ],
      };
    case 'password_changed_notification':
      return {
        subject: 'Your HandLancer password was changed',
        preheader: 'If this was you, there’s nothing to do.',
        tag: 'Security',
        heading: 'Your password was',
        emphasis: 'changed',
        blocks: [
          { kind: 'p', text: 'The password on your HandLancer account was just changed. If that was you, there’s nothing else to do.' },
          { kind: 'p', text: 'If it wasn’t, reset it now and reply to this email so we can secure your wallet.' },
        ],
        cta: { label: 'Reset my password', url: `${appUrl}/app/forgot-password` },
      };
    case 'email_changed_notification':
      return {
        subject: 'Your HandLancer email was changed',
        preheader: 'If this was you, there’s nothing to do.',
        tag: 'Security',
        heading: 'Your email was',
        emphasis: 'changed',
        blocks: [
          { kind: 'p', text: `The email on your HandLancer account is now ${input.newEmail ?? 'a different address'}. If that was you, there’s nothing else to do.` },
          { kind: 'p', text: 'If it wasn’t, reply to this email straight away so we can secure your account.' },
        ],
      };
  }
}

// ─────────────────────────── Product ───────────────────────────

export type ProductInput = {
  event: string;
  appUrl: string;
  /** Recipient's display name, when known. */
  name?: string;
  data: Data;
};

export function productEmail({ event, appUrl, name, data }: ProductInput): Email | null {
  const title = text(data.title, 'your job');
  const jobId = idOrNull(data.job_id);
  const jobUrl = jobId ? `${appUrl}/app/jobs/${jobId}` : `${appUrl}/app/jobs`;
  const walletUrl = `${appUrl}/app/wallet`;
  const first = text(name).split(/\s+/)[0];
  const jobRow: [string, string] = ['Job', title];
  const manageUrl = `${appUrl}/app/settings`;

  switch (event) {
    // ── Getting started ──
    case 'welcome':
      if (data.role === 'provider') {
        return {
          subject: 'Next: finish your HandLancer application',
          preheader: 'Add your trades and work photos, then send it for review.',
          tag: 'Getting started',
          heading: first ? `Welcome, ${first}.` : 'Welcome.',
          emphasis: 'Now the application',
          blocks: [
            { kind: 'p', text: 'Every artisan on HandLancer is reviewed by a person before customers can find them. It takes a few minutes to apply: your photo, phone number, area, trades, and some photos of work you’ve done.' },
            { kind: 'p', text: 'Joining is free and HandLancer takes no commission.' },
          ],
          cta: { label: 'Finish my application', url: `${appUrl}/app/apply` },
        };
      }
      return {
        subject: 'Welcome to HandLancer',
        preheader: 'Post a job, compare quotes, and pay only when the work is done.',
        tag: 'Getting started',
        heading: first ? `Welcome, ${first}.` : 'Welcome.',
        emphasis: 'Nobody pays first',
        blocks: [
          { kind: 'p', text: 'Post a job and compare itemised quotes from artisans near you. When you hire one, your money waits in escrow, and you release each payment only when the work is done.' },
        ],
        cta: { label: 'Post a job', url: `${appUrl}/app/jobs/new` },
      };
    case 'waitlist_joined':
      // Anyone can type any address into the public form, so this carries
      // nothing the submitter wrote: it can't be used to send a stranger a message.
      return {
        subject: 'You’re on the HandLancer list',
        preheader: 'We’ll email you when HandLancer opens in your city.',
        tag: 'Waitlist',
        heading: 'You’re on',
        emphasis: 'the list',
        blocks: [
          {
            kind: 'p',
            text:
              data.role === 'provider'
                ? 'Thanks for your interest in working through HandLancer. Artisans can already apply in the browser, and every application is reviewed by a person.'
                : 'We’re opening city by city, once there are approved artisans to hire. We’ll email you when yours opens, and not before.',
          },
        ],
        cta: data.role === 'provider' ? { label: 'Apply as an artisan', url: `${appUrl}/app/sign-in?role=provider` } : undefined,
        footnote: 'You’re getting this because this address joined the HandLancer waitlist. If that wasn’t you, ignore this email.',
      };

    // ── Artisan review ──
    case 'artisan_application_received':
      return {
        subject: 'We’ve got your HandLancer application',
        preheader: 'A person will review it and may call you.',
        tag: 'Application',
        heading: 'Application',
        emphasis: 'received',
        blocks: [
          { kind: 'p', text: 'A person at HandLancer will go through your profile and work photos, and may call the number you gave us. We’ll email you as soon as there’s a decision.' },
        ],
        cta: { label: 'See my application', url: `${appUrl}/app` },
      };
    case 'artisan_approved':
      return {
        subject: 'You’re approved on HandLancer',
        preheader: 'Customers can find you now, and you can quote on open jobs.',
        tag: 'Application',
        heading: 'You’re',
        emphasis: 'approved',
        blocks: [
          { kind: 'p', text: 'Customers can find you now, and you can quote on open jobs. Before your first payout, add a transfer PIN and a bank account in your wallet.' },
        ],
        cta: { label: 'Find work', url: `${appUrl}/app/find-work` },
      };
    case 'artisan_changes_requested':
      return {
        subject: 'Your HandLancer application needs changes',
        preheader: 'A reviewer has asked you to update something.',
        tag: 'Application',
        heading: 'A few',
        emphasis: 'changes needed',
        blocks: [
          { kind: 'p', text: 'Your application isn’t approved yet. Update it and send it back, and we’ll look again.' },
          { kind: 'quote', label: 'From your reviewer', text: text(data.note, 'Update your profile and send it again.') },
        ],
        cta: { label: 'Update my application', url: `${appUrl}/app/apply` },
      };
    case 'artisan_suspended':
      return {
        subject: 'Your HandLancer artisan account is suspended',
        preheader: 'Customers can’t find you while your account is suspended.',
        tag: 'Application',
        heading: 'Your account is',
        emphasis: 'suspended',
        blocks: [
          { kind: 'p', text: 'Customers can’t find you and you can’t send quotes while your account is suspended. Reply to this email if you’d like to talk it through.' },
          { kind: 'quote', label: 'Reason', text: text(data.note, 'Contact support to find out why.') },
        ],
      };

    // ── Jobs and escrow ──
    case 'quote_received':
      return {
        subject: `New quote on “${title}”`,
        preheader: 'Compare the itemised price and hire when you’re ready.',
        tag: 'Quotes',
        heading: 'You have a',
        emphasis: 'new quote',
        blocks: [
          { kind: 'p', text: 'An artisan has priced your job, with materials and labour itemised. Nothing is charged until you hire someone.' },
          { kind: 'rows', rows: [jobRow] },
        ],
        cta: { label: 'Compare quotes', url: jobId ? `${appUrl}/app/jobs/${jobId}/quotes` : `${appUrl}/app/jobs` },
        manageUrl,
      };
    case 'quote_not_selected':
      return {
        subject: `Your quote on “${title}” wasn’t chosen`,
        preheader: 'The customer went with someone else this time.',
        tag: 'Quotes',
        heading: 'Not this',
        emphasis: 'time',
        blocks: [
          { kind: 'p', text: 'The customer went with another artisan on this job. There are other open jobs waiting for a price.' },
          { kind: 'rows', rows: [jobRow] },
        ],
        cta: { label: 'Find more work', url: `${appUrl}/app/find-work` },
        manageUrl,
      };
    case 'job_invited':
      return {
        subject: `A customer asked for you: “${title}”`,
        preheader: 'Only you can quote on this job.',
        tag: 'Jobs',
        heading: 'A customer asked',
        emphasis: 'for you',
        blocks: [
          { kind: 'p', text: 'A customer picked you from the directory and sent this job straight to you. Nobody else can quote on it.' },
          { kind: 'rows', rows: [jobRow] },
        ],
        cta: { label: 'See the job', url: jobUrl },
      };
    case 'job_alert':
      return {
        subject: `New job near you: “${title}”`,
        preheader: text(data.location, 'A customer is looking for someone with your trade.'),
        tag: 'New work',
        heading: 'A new job',
        emphasis: 'near you',
        blocks: [
          { kind: 'p', text: 'A customer has posted a job that matches your trade. Quotes are compared side by side, so an early, itemised price stands out.' },
          {
            kind: 'rows',
            rows: [
              jobRow,
              ...(data.location ? [['Area', text(data.location)] as [string, string]] : []),
              ['Budget', Number(data.budget) > 0 ? naira(data.budget) : 'Open'],
            ],
          },
        ],
        cta: { label: 'See the job', url: jobUrl },
        footnote: 'We send at most one of these an hour. See every open job under Find Work.',
        manageUrl,
      };
    case 'hired':
      return {
        subject: `You were hired for “${title}”`,
        preheader: 'The payment is already held in escrow.',
        tag: 'Jobs',
        heading: 'You were',
        emphasis: 'hired',
        blocks: [
          { kind: 'p', text: 'The customer’s payment is already held in escrow, so you can start knowing the money is there.' },
          { kind: 'rows', rows: [jobRow] },
        ],
        cta: { label: 'Open the job', url: jobUrl },
      };
    case 'escrow_funded':
      return {
        subject: `${naira(data.amount)} is held in escrow`,
        preheader: 'The artisan can see it’s there but can’t touch it yet.',
        tag: 'Escrow',
        heading: 'Your money is',
        emphasis: 'held safely',
        blocks: [
          { kind: 'p', text: 'The artisan can see the money is there but can’t touch it. You release each payment when the work has earned it.' },
          { kind: 'rows', rows: [jobRow, ['Held in escrow', naira(data.amount)]] },
        ],
        cta: { label: 'Open the job', url: jobUrl },
      };
    case 'materials_requested':
      return {
        subject: `Materials money requested on “${title}”`,
        preheader: `Your artisan has asked for ${naira(data.amount)} to buy materials.`,
        tag: 'Escrow',
        heading: 'Materials money',
        emphasis: 'requested',
        blocks: [
          { kind: 'p', text: 'Your artisan is ready to buy materials and has asked you to release that part of the escrow.' },
          { kind: 'rows', rows: [jobRow, ['Requested', naira(data.amount)]] },
        ],
        cta: { label: 'Review the request', url: jobUrl },
      };
    case 'escrow_release':
      return {
        subject: `${naira(data.amount)} released for materials`,
        preheader: 'It’s in your HandLancer wallet.',
        tag: 'Wallet',
        heading: 'Materials money',
        emphasis: 'released',
        blocks: [
          { kind: 'p', text: 'The customer released the materials part of the escrow. It’s in your HandLancer wallet.' },
          { kind: 'rows', rows: [jobRow, ['Released', naira(data.amount)]] },
        ],
        cta: { label: 'Open the job', url: jobUrl },
      };
    case 'completion_requested':
      return {
        subject: `Check the finished work on “${title}”`,
        preheader: 'Review the work to release the final payment.',
        tag: 'Jobs',
        heading: 'The work is',
        emphasis: 'marked complete',
        blocks: [
          { kind: 'p', text: 'Your artisan says the job is done. Check the work. If you’re happy, rate it to release the final payment. If something’s wrong, don’t release it: open a dispute from the job screen and the money stays frozen.' },
          { kind: 'rows', rows: [jobRow] },
        ],
        cta: { label: 'Review the work', url: jobId ? `${appUrl}/app/jobs/${jobId}/review` : `${appUrl}/app/jobs` },
      };
    case 'payout':
      return {
        subject: `You were paid ${naira(data.amount)}`,
        preheader: 'It’s in your HandLancer wallet.',
        tag: 'Wallet',
        heading: 'You’ve been',
        emphasis: 'paid',
        blocks: [
          { kind: 'p', text: 'The customer signed off the work and your payment is in your HandLancer wallet.' },
          { kind: 'rows', rows: [...(data.title ? [jobRow] : []), ['Paid to wallet', naira(data.amount)]] },
        ],
        cta: { label: 'Go to my wallet', url: walletUrl },
      };
    case 'review':
      return {
        subject: `New ${text(String(data.rating ?? ''))}-star review on HandLancer`,
        preheader: 'See what your customer said.',
        tag: 'Reviews',
        heading: 'You have a',
        emphasis: 'new review',
        blocks: [
          { kind: 'p', text: 'A customer rated the work you did. Reviews come only from people who hired and paid through HandLancer.' },
          { kind: 'rows', rows: [...(data.title ? [jobRow] : []), ['Rating', `${Number(data.rating ?? 0)} out of 5`]] },
        ],
        cta: { label: 'See my reviews', url: `${appUrl}/app/profile/reviews` },
        manageUrl,
      };
    case 'message': {
      const conversationId = idOrNull(data.conversation_id);
      const preview = text(data.preview);
      return {
        subject: 'New message on HandLancer',
        preheader: preview || 'Open HandLancer to read and reply.',
        tag: 'Messages',
        heading: 'You have a',
        emphasis: 'new message',
        blocks: preview ? [{ kind: 'quote', label: 'Message', text: preview }] : [{ kind: 'p', text: 'Open HandLancer to read it and reply.' }],
        cta: { label: 'Reply', url: conversationId ? `${appUrl}/app/messages/${conversationId}` : `${appUrl}/app/messages` },
        footnote: 'We email you once per conversation, however many messages arrive, until you’ve had a while to reply.',
        manageUrl,
      };
    }

    // ── Disputes ──
    case 'dispute_received':
      return {
        subject: `We’ve got your dispute on “${title}”`,
        preheader: 'The money stays frozen while support reviews it.',
        tag: 'Disputes',
        heading: 'Your dispute is',
        emphasis: 'open',
        blocks: [
          { kind: 'p', text: 'The money stays frozen in escrow while support hears from both of you. Keep any photos or messages about the work, as we may ask for them.' },
          { kind: 'rows', rows: [jobRow, ...(data.reference ? [['Reference', text(data.reference)] as [string, string]] : [])] },
        ],
        cta: { label: 'Open the job', url: jobUrl },
      };
    case 'dispute_opened':
      return {
        subject: `A dispute was opened on “${title}”`,
        preheader: 'The payment is on hold while support reviews it.',
        tag: 'Disputes',
        heading: 'A job was',
        emphasis: 'disputed',
        blocks: [
          { kind: 'p', text: 'The payment on this job is on hold while support reviews it. Someone from HandLancer will contact you to hear your side. Quote the reference below when you do.' },
          { kind: 'rows', rows: [jobRow, ...(data.reference ? [['Reference', text(data.reference)] as [string, string]] : [])] },
        ],
        cta: { label: 'Open the job', url: jobUrl },
      };
    case 'dispute_resolved':
      return {
        subject: `Dispute resolved on “${title}”`,
        preheader: `${naira(data.released)} released, ${naira(data.refunded)} refunded.`,
        tag: 'Disputes',
        heading: 'Your dispute is',
        emphasis: 'resolved',
        blocks: [
          { kind: 'p', text: 'Support has reviewed this job and settled the escrow as below. Any money due to you is already in your wallet.' },
          { kind: 'rows', rows: [jobRow, ['Released to artisan', naira(data.released)], ['Refunded to customer', naira(data.refunded)]] },
        ],
        cta: { label: 'Go to my wallet', url: walletUrl },
      };

    // ── Wallet and security ──
    case 'wallet_funded':
      return {
        subject: `${naira(data.amount)} added to your wallet`,
        preheader: 'Your top-up has arrived.',
        tag: 'Wallet',
        heading: 'Your wallet is',
        emphasis: 'topped up',
        blocks: [{ kind: 'rows', rows: [['Added', naira(data.amount)], ...(data.reference ? [['Reference', text(data.reference)] as [string, string]] : [])] }],
        cta: { label: 'Go to my wallet', url: walletUrl },
      };
    case 'withdrawal_requested':
      return {
        subject: `Withdrawal of ${naira(data.amount)} requested`,
        preheader: 'If this wasn’t you, tell us now.',
        tag: 'Wallet',
        heading: 'Withdrawal',
        emphasis: 'on its way',
        blocks: [
          { kind: 'p', text: 'We’ve received your withdrawal and will send it to your linked bank account.' },
          { kind: 'rows', rows: [['Amount', naira(data.amount)]] },
          { kind: 'fine', text: 'Didn’t request this? Reply to this email straight away.' },
        ],
        cta: { label: 'See my wallet', url: walletUrl },
      };
    case 'withdrawal_paid':
      return {
        subject: `${naira(data.amount)} sent to your bank`,
        preheader: 'Your withdrawal has been paid.',
        tag: 'Wallet',
        heading: 'Withdrawal',
        emphasis: 'paid',
        blocks: [
          { kind: 'p', text: 'Your withdrawal has been sent to your linked bank account.' },
          { kind: 'rows', rows: [['Amount', naira(data.amount)], ...(data.reference ? [['Reference', text(data.reference)] as [string, string]] : [])] },
        ],
        cta: { label: 'See my wallet', url: walletUrl },
      };
    case 'withdrawal_failed':
      return {
        subject: `Your withdrawal of ${naira(data.amount)} didn’t go through`,
        preheader: 'The money is back in your HandLancer wallet.',
        tag: 'Wallet',
        heading: 'Withdrawal',
        emphasis: 'failed',
        blocks: [
          { kind: 'p', text: 'We couldn’t send this withdrawal to your bank, so the money is back in your HandLancer wallet. Check your account details before you try again, or reply to this email and we’ll help.' },
          { kind: 'rows', rows: [['Returned to wallet', naira(data.amount)]] },
        ],
        cta: { label: 'Check my bank details', url: `${appUrl}/app/wallet/bank` },
      };
    case 'pin_changed':
      return {
        subject: data.first ? 'Your HandLancer transfer PIN is set' : 'Your HandLancer transfer PIN was changed',
        preheader: 'If this was you, there’s nothing to do.',
        tag: 'Security',
        heading: 'Transfer PIN',
        emphasis: data.first ? 'set' : 'changed',
        blocks: [
          { kind: 'p', text: 'Your PIN confirms every withdrawal and release from your wallet. If this was you, there’s nothing else to do.' },
          { kind: 'p', text: 'If it wasn’t, reset your password and reply to this email straight away.' },
        ],
        cta: { label: 'Reset my password', url: `${appUrl}/app/forgot-password` },
      };
    case 'pin_locked':
      return {
        subject: 'Your HandLancer wallet is locked for 15 minutes',
        preheader: 'Too many incorrect PIN attempts.',
        tag: 'Security',
        heading: 'Wallet',
        emphasis: 'locked',
        blocks: [
          { kind: 'p', text: 'After five incorrect transfer PIN attempts, withdrawals and releases are locked for 15 minutes.' },
          { kind: 'p', text: 'If that wasn’t you, someone may have your password. Reset it and reply to this email.' },
        ],
        cta: { label: 'Reset my password', url: `${appUrl}/app/forgot-password` },
      };
    case 'bank_changed':
      return {
        subject: 'Your HandLancer payout account was changed',
        preheader: 'If this was you, there’s nothing to do.',
        tag: 'Security',
        heading: 'Payout account',
        emphasis: 'updated',
        blocks: [
          { kind: 'p', text: 'Withdrawals will now go to this account.' },
          { kind: 'rows', rows: [['Bank', text(data.bank_name, 'Your bank')], ['Account', `•••• ${text(data.last4)}`]] },
          { kind: 'fine', text: 'Didn’t make this change? Reply to this email straight away, before withdrawing anything.' },
        ],
        cta: { label: 'See my wallet', url: walletUrl },
      };
    case 'account_deleted':
      return {
        subject: 'Your HandLancer account has been deleted',
        preheader: 'Your personal details have been erased.',
        tag: 'Account',
        heading: 'Your account is',
        emphasis: 'deleted',
        blocks: [
          { kind: 'p', text: 'Your name, photo, phone, location and bank details have been erased, and you can no longer sign in. Finished jobs, payments and reviews stay on the other person’s side, shown as “Deleted user”.' },
          { kind: 'p', text: 'If you didn’t do this, reply to this email straight away.' },
        ],
        footnote: 'This is the last email you’ll get about this account.',
      };

    // ── Support inbox ──
    case 'admin_artisan_submitted': {
      const id = idOrNull(data.artisan_id);
      return {
        subject: `Artisan application: ${text(data.name, 'New applicant')}`,
        preheader: 'A new application is waiting for review.',
        tag: 'Admin',
        heading: 'Application to',
        emphasis: 'review',
        blocks: [{ kind: 'rows', rows: [['Name', text(data.name, 'Not given')], ['Area', text(data.location, 'Not given')], ['Status', data.resubmitted ? 'Resubmitted' : 'New']] }],
        cta: { label: 'Review application', url: id ? `${appUrl}/admin/artisans/${id}` : `${appUrl}/admin/artisans` },
        footnote: 'Sent to the HandLancer support inbox.',
      };
    }
    case 'admin_dispute_opened': {
      const id = idOrNull(data.dispute_id);
      return {
        subject: `Dispute ${text(data.reference, 'opened')}: ${title}`,
        preheader: 'Escrow is frozen until this is settled.',
        tag: 'Admin',
        heading: 'Dispute',
        emphasis: 'opened',
        blocks: [
          { kind: 'rows', rows: [jobRow, ['Reference', text(data.reference, 'None')], ['Category', text(data.category, 'Not given')]] },
          { kind: 'quote', label: 'What the customer said', text: text(data.reason, 'No reason given.') },
        ],
        cta: { label: 'Open dispute', url: id ? `${appUrl}/admin/disputes/${id}` : `${appUrl}/admin/disputes` },
        footnote: 'Sent to the HandLancer support inbox.',
      };
    }
    default:
      return null;
  }
}

/** Every event productEmail() answers. Used by tests and the preview. */
export const PRODUCT_EVENTS = [
  'welcome',
  'waitlist_joined',
  'artisan_application_received',
  'artisan_approved',
  'artisan_changes_requested',
  'artisan_suspended',
  'quote_received',
  'quote_not_selected',
  'job_invited',
  'job_alert',
  'hired',
  'escrow_funded',
  'materials_requested',
  'escrow_release',
  'completion_requested',
  'payout',
  'review',
  'message',
  'dispute_received',
  'dispute_opened',
  'dispute_resolved',
  'wallet_funded',
  'withdrawal_requested',
  'withdrawal_paid',
  'withdrawal_failed',
  'pin_changed',
  'pin_locked',
  'bank_changed',
  'account_deleted',
  'admin_artisan_submitted',
  'admin_dispute_opened',
] as const;
