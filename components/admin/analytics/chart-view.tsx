'use client';

import { Funnel, RankedBars } from '@/components/admin/charts/bars';
import { TrendChart } from '@/components/admin/charts/trend-chart';
import type { ChartSpec } from '@/lib/admin/analytics/sections';

/** Renders a section's chart spec at any size — the page card or a full slide. */
export function ChartView({ spec, height = 260, ariaLabel }: { spec: ChartSpec; height?: number; ariaLabel: string }) {
  switch (spec.kind) {
    case 'trend':
      return (
        <TrendChart
          labels={spec.labels}
          tooltipLabels={spec.tooltipLabels}
          series={spec.series}
          format={spec.format}
          mode={spec.mode}
          height={height}
          ariaLabel={ariaLabel}
          partial={spec.partial}
        />
      );
    case 'bars':
      return (
        <RankedBars
          items={spec.items}
          format={spec.format}
          secondaryFormat={spec.secondaryFormat}
          secondaryLabel={spec.secondaryLabel}
        />
      );
    case 'funnel':
      return <Funnel steps={spec.steps} />;
  }
}
