import type { Guide } from '@/lib/guides';

const guide: Guide = {
  meta: {
    slug: 'how-escrow-protects-you',
    title: 'How escrow protects both sides of a job',
    description:
      'What happens to your money between approving a quote and signing off the work — and why escrow is split into materials and workmanship rather than held as one lump.',
    published: '2026-08-22',
    updated: '2026-08-22',
    author: 'HandLancer',
    targetKeyword: 'escrow payment for artisans in Nigeria',
  },
  lede: 'Everyone has heard both horror stories: the artisan who takes a deposit and stops answering, and the customer who goes quiet the day the work finishes. Escrow exists because both are the same problem wearing different clothes.',
  body: [
    {
      kind: 'paragraph',
      text: 'The standoff at the start of every job is simple. The artisan cannot buy cement and cable out of pocket for a stranger. The customer cannot hand cash to someone they have never worked with. Somebody has to move first, and whoever does is exposed.',
    },
    {
      kind: 'paragraph',
      text: 'Escrow removes the choice. The money leaves the customer’s wallet — so the artisan can see the job is genuinely funded — but the artisan cannot withdraw it. It sits with HandLancer until specific things happen.',
    },
    { kind: 'heading', text: 'Why escrow is split in two' },
    {
      kind: 'paragraph',
      text: 'Holding the entire amount until the end sounds safer, but it recreates the original problem: the artisan is still funding your materials. So every quote is itemised into material line items and labour line items, and those two totals become the two halves of escrow.',
    },
    {
      kind: 'list',
      items: [
        'The materials portion is released early, so the artisan buys supplies with your money rather than their own.',
        'The workmanship portion — their actual profit — stays locked until you have seen the finished work and rated it.',
      ],
    },
    {
      kind: 'callout',
      title: 'The part that matters',
      text: 'Your rating and the final payout are written in a single database transaction. They succeed or fail together, so no artisan is ever paid without a review attached, and no review can be bought without a funded, completed job behind it.',
    },
    { kind: 'heading', text: 'The four moments money moves' },
    {
      kind: 'list',
      items: [
        'You approve a quote. The artisan is hired, the other quotes are rejected, and nothing has moved yet.',
        'The job is funded. The full amount leaves your wallet and is locked.',
        'You release materials. Only the material line items move across.',
        'You rate and release. The workmanship portion moves, and the job closes.',
      ],
    },
    { kind: 'heading', text: 'What if the work is wrong' },
    {
      kind: 'paragraph',
      text: 'Do not release the workmanship portion. Opening a dispute freezes the money exactly where it is while the case is reviewed. Because artisans photograph the site on arrival and on completion, and that media is filed against the job record rather than a chat thread, both sides have a timestamped record neither can quietly delete.',
    },
    {
      kind: 'paragraph',
      text: 'Nothing gets released because one side got tired of arguing. That is the whole point.',
    },
  ],
};

export default guide;
