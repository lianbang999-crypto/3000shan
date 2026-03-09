import { v4 as uuid } from 'uuid';
import { db } from './index';
import type { DbItem } from './index';

import mindGood from '../data/items-mind-good.json';
import mindBad from '../data/items-mind-bad.json';
import speechGood from '../data/items-speech-good.json';
import speechBad from '../data/items-speech-bad.json';
import bodyGood from '../data/items-body-good.json';
import bodyBad from '../data/items-body-bad.json';

interface RawItem {
  text: string;
  explanation: string;
  referenceScore: number;
  source: string;
}

function toDbItems(
  raw: RawItem[],
  type: 'good' | 'bad',
  category: 'body' | 'speech' | 'mind'
): DbItem[] {
  return raw.map((r) => ({
    id: uuid(),
    text: r.text,
    explanation: r.explanation,
    type,
    category,
    source: r.source,
    referenceScore: r.referenceScore,
    isSystem: true,
    createdAt: Date.now(),
  }));
}

export async function seedDatabase(): Promise<void> {
  const count = await db.items.count();
  if (count > 0) return; // Already seeded

  const allItems: DbItem[] = [
    ...toDbItems(mindGood as RawItem[], 'good', 'mind'),
    ...toDbItems(mindBad as RawItem[], 'bad', 'mind'),
    ...toDbItems(speechGood as RawItem[], 'good', 'speech'),
    ...toDbItems(speechBad as RawItem[], 'bad', 'speech'),
    ...toDbItems(bodyGood as RawItem[], 'good', 'body'),
    ...toDbItems(bodyBad as RawItem[], 'bad', 'body'),
  ];

  await db.items.bulkAdd(allItems);

  // Set initial settings
  await db.settings.bulkPut([
    { key: 'onboarded', value: false },
    { key: 'goal', value: 3000 },
    { key: 'theme', value: 'light' },
  ]);
}
