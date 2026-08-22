import type { Guide } from '@/lib/guides';

const guide: Guide = {
  meta: {
    slug: 'how-to-read-an-itemised-quote',
    title: 'How to read an itemised quote',
    description:
      'What each line on an artisan’s quote actually means, which ones decide your escrow split, and the three questions worth asking before you approve one.',
    published: '2026-08-22',
    updated: '2026-08-22',
    author: 'HandLancer',
    targetKeyword: 'how to compare artisan quotes',
  },
  lede: 'A quote you cannot read is a number you are being asked to trust. An itemised one turns the same job into a list of decisions you can actually check.',
  body: [
    {
      kind: 'paragraph',
      text: 'Every quote on HandLancer is broken into material line items and labour line items. That is not presentation — those two totals become the two halves of escrow, so the itemisation literally determines how your money is held.',
    },
    { kind: 'heading', text: 'Material lines' },
    {
      kind: 'paragraph',
      text: 'These are the things that get consumed or installed: pipe, cable, board, paint, a pump. You release this portion early so the artisan is not funding your supplies out of pocket. Check quantities and specification, not just price — "board" and "moisture-resistant board" are different jobs in a humid climate.',
    },
    { kind: 'heading', text: 'Labour lines' },
    {
      kind: 'paragraph',
      text: 'This is the artisan’s time and skill, and it is the portion that stays locked until you have seen the finished work and rated it. A suspiciously low labour figure usually means something has been left out of scope — most often preparation.',
    },
    {
      kind: 'callout',
      title: 'Cheapest is only cheapest at equal scope',
      text: 'Quotes arrive sorted by total price, which makes comparison easy and misleading in equal measure. Before comparing totals, check that all three quotes include the same preparation, the same specification and the same making-good afterwards.',
    },
    { kind: 'heading', text: 'Three questions worth asking' },
    {
      kind: 'list',
      items: [
        'What is the cause, not just the fix? A remedy without a diagnosis tends to come back.',
        'What is excluded? Making good, disposal and preparation are the usual omissions.',
        'What happens if it opens up worse than expected? Agree that before funding, not halfway through.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'You can message any artisan in-app before approving a quote. Asking these three questions costs nothing and is the cheapest part of any job.',
    },
  ],
};

export default guide;
