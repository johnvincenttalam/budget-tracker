export const chartTheme = {
  tooltip: {
    contentStyle: {
      backgroundColor: '#1C1C1E',
      border: '1px solid #2C2C2E',
      borderRadius: '0.75rem',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#FFFFFF',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    },
    itemStyle: {
      color: '#AEAEB2',
      fontSize: '11px',
    },
    labelStyle: {
      color: '#FFFFFF',
      fontWeight: 600,
      fontSize: '12px',
    },
  },
  grid: {
    stroke: '#2C2C2E',
    strokeDasharray: '3 3',
  },
  axis: {
    tick: { fill: '#636366', fontSize: 10 },
    line: { stroke: '#2C2C2E' },
  },
  colors: {
    emerald: '#34C759',
    red: '#FF453A',
    blue: '#007AFF',
    purple: '#BF5AF2',
    amber: '#FF9F0A',
    cyan: '#64D2FF',
  },
} as const;
