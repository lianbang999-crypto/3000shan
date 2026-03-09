export type ItemType = 'good' | 'bad';
export type Category = 'body' | 'speech' | 'mind';

export const CATEGORY_LABELS: Record<Category, string> = {
  body: '身',
  speech: '口',
  mind: '意',
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  body: '身业 — 行为举止',
  speech: '口业 — 言语表达',
  mind: '意业 — 起心动念',
};

export const TYPE_LABELS: Record<ItemType, string> = {
  good: '功',
  bad: '过',
};

export const CATEGORIES: Category[] = ['body', 'speech', 'mind'];

export const DEFAULT_GOAL = 3000;

export const BACKFILL_DAYS = 7;
