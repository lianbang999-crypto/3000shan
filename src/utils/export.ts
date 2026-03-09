import type { Category, ItemType } from './constants';

export interface DeedItem {
  id: string;
  text: string;
  explanation: string;
  type: ItemType;
  category: Category;
  source: string;
  referenceScore: number;
  isSystem: boolean;
  createdAt: number;
}

export interface Favorite {
  id: string;
  itemId: string;
  order: number;
  addedAt: number;
}

export interface DailyRecord {
  id: string;
  date: string;
  itemId: string;
  type: ItemType;
  category: Category;
  note: string;
  isBackfill: boolean;
  createdAt: number;
}

export interface Reflection {
  id: string;
  date: string;
  text: string;
  createdAt: number;
}

export function exportToJSON(records: DailyRecord[], items: DeedItem[]): string {
  const itemMap = new Map(items.map(i => [i.id, i]));
  const exportData = records.map(r => {
    const item = itemMap.get(r.itemId);
    return {
      date: r.date,
      type: r.type === 'good' ? '功' : '过',
      category: r.category === 'body' ? '身' : r.category === 'speech' ? '口' : '意',
      item: item?.text || '(已删除)',
      note: r.note || '',
      isBackfill: r.isBackfill,
    };
  });
  return JSON.stringify(exportData, null, 2);
}

export function exportToCSV(records: DailyRecord[], items: DeedItem[]): string {
  const itemMap = new Map(items.map(i => [i.id, i]));
  const header = '日期,类型,三业,条目,笔记,是否补录\n';
  const rows = records.map(r => {
    const item = itemMap.get(r.itemId);
    const type = r.type === 'good' ? '功' : '过';
    const cat = r.category === 'body' ? '身' : r.category === 'speech' ? '口' : '意';
    const text = (item?.text || '已删除').replace(/"/g, '""');
    const note = (r.note || '').replace(/"/g, '""');
    return `${r.date},${type},${cat},"${text}","${note}",${r.isBackfill ? '是' : '否'}`;
  });
  return header + rows.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
