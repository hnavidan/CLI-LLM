import { TimeRangeOption } from '../types/index';

export const relativeTimeOptions: TimeRangeOption[] = [
  { label: 'Last data point', value: '1s' },
  { label: 'Last 5 seconds', value: '5s' },
  { label: 'Last 10 seconds', value: '10s' },
  { label: 'Last 1 minute', value: '1m' },
  { label: 'Last 5 minutes', value: '5m' },
  { label: 'Last 1 hour', value: '1h' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
];

export const timeRangeTypeOptions: TimeRangeOption[] = [
  { label: 'Use Dashboard Time', value: 'dashboard' },
  { label: 'Relative Time', value: 'relative' },
  { label: 'Absolute Time', value: 'absolute' },
];
