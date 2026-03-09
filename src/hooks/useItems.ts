import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category, ItemType } from '../utils/constants';

export function useItems(category?: Category, type?: ItemType) {
  return useLiveQuery(async () => {
    let query = db.items.toCollection();
    if (category) {
      query = db.items.where('category').equals(category);
    }
    const all = await query.toArray();
    if (type) {
      return all.filter((i) => i.type === type);
    }
    return all;
  }, [category, type]) ?? [];
}

export function useSystemItems(category?: Category, type?: ItemType) {
  return useLiveQuery(async () => {
    const all = await db.items.where('isSystem').equals(1).toArray();
    return all.filter((i) => {
      if (category && i.category !== category) return false;
      if (type && i.type !== type) return false;
      return true;
    });
  }, [category, type]) ?? [];
}

export function useSearchItems(query: string) {
  return useLiveQuery(async () => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    const all = await db.items.toArray();
    return all.filter(
      (i) =>
        i.text.toLowerCase().includes(q) ||
        i.explanation.toLowerCase().includes(q)
    );
  }, [query]) ?? [];
}

export async function addCustomItem(
  text: string,
  type: ItemType,
  category: Category,
  explanation?: string
) {
  const { v4: uuid } = await import('uuid');
  const item = {
    id: uuid(),
    text,
    explanation: explanation || '',
    type,
    category,
    source: '自定义',
    referenceScore: 1,
    isSystem: false,
    createdAt: Date.now(),
  };
  await db.items.add(item);
  return item;
}

export async function deleteCustomItem(id: string) {
  const item = await db.items.get(id);
  if (item && !item.isSystem) {
    await db.items.delete(id);
    // Also remove from favorites
    await db.favorites.where('itemId').equals(id).delete();
  }
}
