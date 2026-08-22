import type { Guide } from '@/lib/guides';

const guide: Guide = {
  meta: {
    slug: 'plumber-cost-uyo',
    title: 'What a plumber costs in Uyo',
    description:
      'Indicative workmanship rates for common plumbing jobs in Uyo, why soakaway work costs what it does on a high water table, and how to read a plumbing quote before you fund it.',
    published: '2026-08-22',
    updated: '2026-08-22',
    author: 'HandLancer',
    targetKeyword: 'plumber cost Uyo',
    trade: 'plumbing',
    city: 'uyo',
  },
  lede: 'Plumbing prices in Uyo are shaped by something most price guides ignore: the water table. Here is what the common jobs actually cost, and which line on a quote decides whether you pay once or twice.',
  body: [
    {
      kind: 'paragraph',
      text: 'The figures below are workmanship only — the labour half of a quote. Materials are quoted separately as their own line items, which is what lets you release the materials money early and keep the labour in escrow until the job is signed off.',
    },
    {
      kind: 'costTable',
      table: {
        caption: 'Indicative plumbing workmanship rates in Uyo',
        columns: ['Job', 'Typical workmanship', 'Notes'],
        rows: [
          ['Leaking tap or float valve', '₦15,000 – ₦25,000', 'Usually one visit'],
          ['Burst pipe repair', '₦20,000 – ₦45,000', 'Depends on access and wall chasing'],
          ['Water heater installation', '₦25,000 – ₦50,000', 'Excludes the unit'],
          ['Borehole pump replacement', '₦35,000 – ₦70,000', 'Excludes pump and tank'],
          ['Soakaway repair or deepening', '₦45,000 – ₦90,000', 'Depth drives the price'],
          ['Full bathroom refit', '₦60,000 – ₦90,000+', 'Excludes sanitaryware and tiling'],
        ],
        note: 'Indicative ranges for Uyo, workmanship only, excluding materials. Actual quotes vary with access, depth and the condition of existing pipework — always compare several itemised quotes rather than treating any single figure as the price.',
      },
    },
    { kind: 'heading', text: 'Why soakaway work costs more here' },
    {
      kind: 'paragraph',
      text: 'Much of Uyo sits on a high water table. A soakaway dug to the depth that works comfortably in a drier state fills from the ground up as well as from the house, which is why so many households here end up paying for evacuation two or three times a season.',
    },
    {
      kind: 'callout',
      title: 'Ask for the depth in writing',
      text: 'If a soakaway quote does not state the intended depth, you have no way of knowing whether you are buying a fix or a repeat of the problem. Get it onto the quote as a material line item before you fund anything.',
    },
    { kind: 'heading', text: 'How to read a plumbing quote' },
    {
      kind: 'list',
      items: [
        'Check that materials and labour are listed separately. A single unexplained number is not a quote.',
        'Look for the diagnosis, not just the remedy. "Needs gas" or "needs replacing" without a cause usually means the fault comes back.',
        'Compare like for like. Quotes arrive sorted by total, but the cheapest is only cheapest if it covers the same scope.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'If you are weighing up quotes, the guide on reading an itemised quote goes through each line type in more detail.',
    },
  ],
};

export default guide;
