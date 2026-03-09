import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { DbFavorite } from '../db';

export function useFavorites() {
  const favorites = useLiveQuery(async () => {
    const favs = await db.favorites.orderBy('order').toArray();
    const itemIds = favs.map((f) => f.itemId);
    const items = await db.items.where('id').anyOf(itemIds).toArray();
    const itemMap = new Map(items.map((i) => [i.id, i]));
    return favs
      .map((f) => ({
        favorite: f,
        item: itemMap.get(f.itemId),
      }))
      .filter((f) => f.item !== undefined);
  }, []) ?? [];

  return favorites;
}

export function useFavoriteIds() {
  return useLiveQuery(async () => {
    const favs = await db.favorites.toArray();
    return new Set(favs.map((f) => f.itemId));
  }, []) ?? new Set<string>();
}

export async function addToFavorites(itemId: string) {
  const existing = await db.favorites.where('itemId').equals(itemId).first();
  if (existing) return;

  const maxOrder = await db.favorites.orderBy('order').last();
  const order = (maxOrder?.order ?? 0) + 1;

  const { v4: uuid } = await import('uuid');
  const fav: DbFavorite = {
    id: uuid(),
    itemId,
    order,
    addedAt: Date.now(),
  };
  await db.favorites.add(fav);
}

export async function removeFromFavorites(itemId: string) {
  await db.favorites.where('itemId').equals(itemId).delete();
}

export async function reorderFavorites(orderedIds: string[]) {
  const updates = orderedIds.map((id, index) =>
    db.favorites.update(id, { order: index })
  );
  await Promise.all(updates);
}
