export type Comparator = 'lt' | 'lte' | 'eq' | 'ne' | 'gte' | 'gt';
export type Expression = [string, Comparator, number];
export interface Evaluation {
  expr: Expression[],
  class?: string
}
export type Evaluations = Evaluation[];