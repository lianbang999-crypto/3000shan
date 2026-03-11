import Dexie, { type Table } from 'dexie';

export interface DbItem {
  id: string;
  text: string;
  explanation: string;
  type: 'good' | 'bad';
  category: 'body' | 'speech' | 'mind';
  source: string;
  referenceScore: number;
  isSystem: boolean;
  createdAt: number;
}

export interface DbFavorite {
  id: string;
  itemId: string;
  order: number;
  addedAt: number;
}

export interface DbRecord {
  id: string;
  date: string;
  itemId?: string;
  text: string;
  type: 'good' | 'bad';
  category: 'body' | 'speech' | 'mind';
  note: string;
  isBackfill: boolean;
  createdAt: number;
}

export interface DbReflection {
  id: string;
  date: string;
  text: string;
  createdAt: number;
}

export interface DbSetting {
  key: string;
  value: unknown;
}

class SanQianShanDB extends Dexie {
  items!: Table<DbItem>;
  favorites!: Table<DbFavorite>;
  records!: Table<DbRecord>;
  reflections!: Table<DbReflection>;
  settings!: Table<DbSetting>;

  constructor() {
    super('sanqianshan');
    this.version(1).stores({
      items: 'id, type, category, isSystem, createdAt',
      favorites: 'id, itemId, order',
      records: 'id, date, itemId, type, category, [date+itemId]',
      reflections: 'id, date',
      settings: 'key',
    });

    this.version(2).stores({
      items: 'id, type, category, isSystem, createdAt',
      favorites: 'id, itemId, order',
      records: 'id, date, itemId, type, category, [date+itemId], createdAt',
      reflections: 'id, date',
      settings: 'key',
    }).upgrade(async (tx) => {
      const records = tx.table('records');
      const items = tx.table('items');
      const allItems = await items.toArray();
      const itemMap = new Map(allItems.map((i: DbItem) => [i.id, i]));
      await records.toCollection().modify((record: DbRecord) => {
        if (!record.text) {
          const item = itemMap.get(record.itemId ?? '');
          record.text = item?.explanation || item?.text || '';
        }
      });
    });
  }
}

export const db = new SanQianShanDB();
