export const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const AGGREGATION_TYPES = ['month', 'quarter', 'semester', 'year'] as const;

export type AggregationType = typeof AGGREGATION_TYPES[number];
