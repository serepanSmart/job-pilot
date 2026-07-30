'use client';

import { JOB_STATUS_LABELS, type JobStatus } from '@jobpilot/db';
import Box from '@mui/material/Box';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { tokens } from '@/theme/tokens';

const axisStyle = { fill: tokens.text.secondary, fontSize: 12 };

const tooltipStyle = {
  backgroundColor: tokens.surface.elevated,
  border: `1px solid ${tokens.border.subtle}`,
  borderRadius: tokens.radius,
  color: tokens.text.primary,
  fontSize: 12,
};

export function FunnelChart({
  data,
}: {
  readonly data: readonly { stage: JobStatus; count: number }[];
}) {
  const rows = data.map((item) => ({
    name: JOB_STATUS_LABELS[item.stage],
    count: item.count,
  }));

  return (
    <Box sx={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke={tokens.border.subtle} />
          <XAxis type="number" allowDecimals={false} tick={axisStyle} />
          <YAxis
            type="category"
            dataKey="name"
            width={84}
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: tokens.chipFill }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {rows.map((row) => (
              <Cell key={row.name} fill={tokens.primary.main} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
FunnelChart.displayName = 'FunnelChart';

export function WeeklyApplicationsChart({
  data,
}: {
  readonly data: readonly { weekStart: string; count: number }[];
}) {
  const rows = data.map((item) => ({
    name: new Date(item.weekStart).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    count: item.count,
  }));

  return (
    <Box sx={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: 0, right: 8 }}>
          <CartesianGrid vertical={false} stroke={tokens.border.subtle} />
          <XAxis
            dataKey="name"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: tokens.chipFill }}
          />
          <Bar
            dataKey="count"
            fill={tokens.primary.light}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
WeeklyApplicationsChart.displayName = 'WeeklyApplicationsChart';
