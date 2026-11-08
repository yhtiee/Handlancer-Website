/**
 * The one HTML shell every HandLancer email goes through.
 *
 * Templates describe an email as data (see `Email`); nothing outside this file
 * writes markup. That is the injection boundary: job titles, chat previews and
 * reviewer notes are user-written, and every string is escaped here on its way
 * into the HTML.
 *
 * Email clients are the constraint on everything below: table layout, inline
 * styles, a system font stack (Georgia stands in for the site's Newsreader,
 * which most clients would not load), and a banner that still reads as the
 * brand with images blocked. Colours are the site's tokens from app/globals.css.
 */

const INK = '#10151b';
const MUTED = '#5b6772';
const NAVY = '#1e3a5f';
const TEAL = '#0fb5a4';
const ON_TEAL = '#06201d';
const BAND = '#f1f4f6';
const RULE = '#e5e9ec';
const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const SERIF = `Georgia,'Times New Roman',serif`;
const MONO = `ui-monospace,SFMono-Regular,Menlo,Consolas,'Courier New',monospace`;

export type Block =
  | { kind: 'p'; text: string }
  /** Label/value lines, like the itemised quotes in the app. */
  | { kind: 'rows'; rows: [label: string, value: string][] }
  /** Someone else's words: a reviewer's note, a chat preview. */
  | { kind: 'quote'; label: string; text: string }
  | { kind: 'code'; code: string }
  /** Small print under the button. */
  | { kind: 'fine'; text: string };

export type Email = {
  subject: string;
  /** The grey line inbox lists show after the subject. */
  preheader: string;
  /** Short section label on the right of the banner. */
  tag: string;
  heading: string;
  /** Italic trailing phrase of the heading, the site's headline device. */
  emphasis?: string;
  blocks: Block[];
  cta?: { label: string; url: string };
  /** Print the button's URL as text too. For links people must be able to use. */
  showLink?: boolean;
  /** Why this person got the email. */
  footnote?: string;
  /** Where to turn this kind of email off. Only for optional email. */
  manageUrl?: string;
};

export type Rendered = { subject: string; html: string; text: string };

const DEFAULT_FOOTNOTE = 'You’re getting this because you have a HandLancer account.';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlock(block: Block): string {
  switch (block.kind) {
    case 'p':
      return `<p style="margin:0 0 16px;font:16px/25px ${SANS};color:${INK}">${escapeHtml(block.text)}</p>`;
    case 'fine':
      return `<p style="margin:20px 0 0;font:13px/20px ${SANS};color:${MUTED}">${escapeHtml(block.text)}</p>`;
    case 'code':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px"><tr><td bgcolor="${BAND}" align="center" style="background:${BAND};border-radius:8px;padding:20px 12px;font:600 30px/36px ${MONO};letter-spacing:.22em;color:${NAVY}">${escapeHtml(block.code)}</td></tr></table>`;
    case 'quote':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px"><tr><td bgcolor="${BAND}" style="background:${BAND};border-radius:8px;padding:16px 18px"><p style="margin:0 0 6px;font:600 11px/16px ${MONO};letter-spacing:.08em;text-transform:uppercase;color:${MUTED}">${escapeHtml(block.label)}</p><p style="margin:0;font:15px/23px ${SANS};color:${INK};white-space:pre-line">${escapeHtml(block.text)}</p></td></tr></table>`;
    case 'rows':
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-top:1px solid ${RULE}">${block.rows
        .map(
          ([label, value]) =>
            `<tr><td valign="top" style="padding:11px 12px 11px 0;border-bottom:1px solid ${RULE};font:14px/21px ${SANS};color:${MUTED}">${escapeHtml(label)}</td><td valign="top" align="right" style="padding:11px 0;border-bottom:1px solid ${RULE};font:600 14px/21px ${SANS};color:${INK}">${escapeHtml(value)}</td></tr>`,
        )
        .join('')}</table>`;
  }
}

function renderBanner(tag: string, appUrl: string): string {
  return `<tr><td class="hl-pad" bgcolor="${NAVY}" style="background:${NAVY};padding:18px 36px;border-bottom:3px solid ${TEAL}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><a href="${escapeHtml(appUrl)}" style="text-decoration:none"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="38" height="38" bgcolor="#ffffff" style="background:#ffffff;border-radius:9px;line-height:0"><img src="${escapeHtml(appUrl)}/brand/logo.png" width="38" height="38" alt="" style="display:block;border:0;border-radius:9px"></td>
<td valign="middle" style="padding-left:11px;font:700 19px/24px ${SANS};letter-spacing:-.03em;color:#ffffff">HandLancer</td>
</tr></table></a></td>
<td valign="middle" align="right" style="font:600 11px/16px ${MONO};letter-spacing:.1em;text-transform:uppercase;color:#c9d2d8">${escapeHtml(tag)}</td>
</tr></table></td></tr>`;
}

function renderButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0"><tr><td bgcolor="${TEAL}" style="background:${TEAL};border-radius:8px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 26px;font:600 16px/20px ${SANS};color:${ON_TEAL};text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;
}

function renderHtml(email: Email, appUrl: string): string {
  const { cta, emphasis } = email;
  const before = email.blocks.filter((b) => b.kind !== 'fine').map(renderBlock).join('');
  const after = email.blocks.filter((b) => b.kind === 'fine').map(renderBlock).join('');
  const link =
    cta && email.showLink
      ? `<p style="margin:20px 0 0;font:13px/20px ${SANS};color:${MUTED}">Button not working? Paste this into your browser:<br><a href="${escapeHtml(cta.url)}" style="color:${NAVY};word-break:break-all">${escapeHtml(cta.url)}</a></p>`
      : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(email.subject)}</title>
<style>
@media (max-width:520px){.hl-pad{padding-left:22px!important;padding-right:22px!important}.hl-h{font-size:27px!important;line-height:33px!important}.hl-outer{padding:0!important}}
</style>
</head>
<body style="margin:0;padding:0;background:${BAND}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BAND}">${escapeHtml(email.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BAND}" style="background:${BAND}">
<tr><td class="hl-outer" align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
${renderBanner(email.tag, appUrl)}
<tr><td class="hl-pad" bgcolor="#ffffff" style="background:#ffffff;padding:36px 36px 38px">
<h1 class="hl-h" style="margin:0 0 18px;font:400 32px/38px ${SERIF};letter-spacing:-.01em;color:${NAVY}">${escapeHtml(email.heading)}${emphasis ? ` <em style="font-style:italic">${escapeHtml(emphasis)}</em>` : ''}</h1>
${before}${cta ? renderButton(cta.label, cta.url) : ''}${link}${after}
</td></tr>
<tr><td class="hl-pad" style="padding:22px 36px 8px;font:13px/20px ${SANS};color:${MUTED}">
${escapeHtml(email.footnote ?? DEFAULT_FOOTNOTE)} Need a hand? Reply to this email and a person will read it.${email.manageUrl ? ` <a href="${escapeHtml(email.manageUrl)}" style="color:${MUTED};text-decoration:underline">Change which emails you get</a>.` : ''}
<br><br><a href="${escapeHtml(appUrl)}" style="color:${MUTED};text-decoration:underline">HandLancer</a> · Hire trusted artisans. Pay only for work done.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderText(email: Email): string {
  const lines: string[] = [[email.heading, email.emphasis].filter(Boolean).join(' '), ''];
  for (const block of email.blocks.filter((b) => b.kind !== 'fine')) {
    if (block.kind === 'p') lines.push(block.text, '');
    if (block.kind === 'code') lines.push(block.code, '');
    if (block.kind === 'quote') lines.push(`${block.label}:`, block.text, '');
    if (block.kind === 'rows') lines.push(...block.rows.map(([l, v]) => `${l}: ${v}`), '');
  }
  if (email.cta) lines.push(`${email.cta.label}: ${email.cta.url}`, '');
  for (const block of email.blocks) if (block.kind === 'fine') lines.push(block.text, '');
  lines.push(`${email.footnote ?? DEFAULT_FOOTNOTE} Need a hand? Reply to this email and a person will read it.`);
  if (email.manageUrl) lines.push(`Change which emails you get: ${email.manageUrl}`);
  return lines.join('\n');
}

export function render(email: Email, appUrl: string): Rendered {
  return { subject: email.subject, html: renderHtml(email, appUrl), text: renderText(email) };
}
