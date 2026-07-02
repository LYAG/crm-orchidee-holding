'use client';

import { Typography } from 'antd';

const { Text } = Typography;

export interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarData[];
  defaultColor?: string;
  barHeight?: number;
  unit?: string;
  emptyText?: string;
}

export function SimpleBarChart({
  data,
  defaultColor = '#5B8C5A',
  barHeight = 100,
  unit = '',
  emptyText = 'Aucune donnée',
}: Props) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const allZero = data.every((d) => d.value === 0);

  if (allZero) {
    return (
      <div
        style={{
          height: barHeight + 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text type="secondary">{emptyText}</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '4px 0' }}>
      {data.map(({ label, value, color }) => {
        const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div
            key={label}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>
              {value}
              {unit}
            </Text>
            <div
              style={{
                width: '100%',
                height: barHeight,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(pct, value > 0 ? 3 : 0)}%`,
                  background: color ?? defaultColor,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s ease',
                  minHeight: value > 0 ? 3 : 0,
                }}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 10, textAlign: 'center' }}>
              {label}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
