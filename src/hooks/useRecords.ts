import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { DbRecord } from '../db';
import { getToday } from '../utils/date';

export function useRecordsByDate(date: string) {
  return useLiveQuery(
    async () => db.records.where('date').equals(date).toArray(),
    [date]
  ) ?? [];
}

export function useRecordedItemIds(date: string) {
  return useLiveQuery(async () => {
    const records = await db.records.where('date').equals(date).toArray();
    return new Set(records.map((r) => r.itemId));
  }, [date]) ?? new Set<string>();
}

export function useTotalGoodCount() {
  return useLiveQuery(async () => {
    return db.records.where('type').equals('good').count();
  }, []) ?? 0;
}

export function useAllRecords() {
  return useLiveQuery(async () => db.records.toArray(), []) ?? [];
}

export function useReflection(date: string) {
  return useLiveQuery(
    async () => db.reflections.where('date').equals(date).first(),
    [date]
  );
}

export async function toggleRecord(
  itemId: string,
  date: string,
  type: 'good' | 'bad',
  category: 'body' | 'speech' | 'mind'
): Promise<boolean> {
  // Check if record exists for this item+date
  const existing = await db.records
    .where('[date+itemId]')
    .equals([date, itemId])
    .first();

  if (existing) {
    await db.records.delete(existing.id);
    return false; // removed
  } else {
    const { v4: uuid } = await import('uuid');
    const isBackfill = date !== getToday();
    const record: DbRecord = {
      id: uuid(),
      date,
      itemId,
      type,
      category,
      note: '',
      isBackfill,
      createdAt: Date.now(),
    };
    await db.records.add(record);
    return true; // added
  }
}

export async function updateRecordNote(recordId: string, note: string) {
  await db.records.update(recordId, { note });
}

export async function saveReflection(date: string, text: string) {
  const existing = await db.reflections.where('date').equals(date).first();
  if (existing) {
    await db.reflections.update(existing.id, { text });
  } else {
    const { v4: uuid } = await import('uuid');
    await db.reflections.add({
      id: uuid(),
      date,
      text,
      createdAt: Date.now(),
    });
  }
}
