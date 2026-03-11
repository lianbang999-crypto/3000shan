import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { DbRecord } from '../db';
import { getToday } from '../utils/date';

export function useRecordsByDate(date: string) {
  return useLiveQuery(
    async () => {
      const records = await db.records.where('date').equals(date).toArray();
      return records.sort((a, b) => a.createdAt - b.createdAt);
    },
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
      text: '',
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

export async function addRecord(
  date: string,
  text: string,
  type: 'good' | 'bad',
): Promise<string> {
  const { v4: uuid } = await import('uuid');
  const isBackfill = date !== getToday();
  const record: DbRecord = {
    id: uuid(),
    date,
    text,
    type,
    category: 'mind',
    note: '',
    isBackfill,
    createdAt: Date.now(),
  };
  await db.records.add(record);
  return record.id;
}

export async function deleteRecord(recordId: string): Promise<void> {
  await db.records.delete(recordId);
}

export async function updateRecordText(recordId: string, text: string): Promise<void> {
  await db.records.update(recordId, { text: text.trim() });
}
