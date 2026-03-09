import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { getDaysAgo, formatDate } from '../utils/date';
import type { Category } from '../utils/constants';

export interface DayStats {
  date: string;
  goodCount: number;
  badCount: number;
}

export interface CategoryStats {
  category: Category;
  goodCount: number;
  badCount: number;
}

export function useDayStats(days: number = 90): DayStats[] {
  return useLiveQuery(async () => {
    const startDate = getDaysAgo(days);
    const records = await db.records.where('date').aboveOrEqual(startDate).toArray();

    const statsMap = new Map<string, DayStats>();
    for (const r of records) {
      if (!statsMap.has(r.date)) {
        statsMap.set(r.date, { date: r.date, goodCount: 0, badCount: 0 });
      }
      const stat = statsMap.get(r.date)!;
      if (r.type === 'good') stat.goodCount++;
      else stat.badCount++;
    }

    return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [days]) ?? [];
}

export function useCategoryStats(startDate?: string): CategoryStats[] {
  return useLiveQuery(async () => {
    let records = await db.records.toArray();
    if (startDate) {
      records = records.filter((r) => r.date >= startDate);
    }

    const stats: Record<Category, CategoryStats> = {
      body: { category: 'body', goodCount: 0, badCount: 0 },
      speech: { category: 'speech', goodCount: 0, badCount: 0 },
      mind: { category: 'mind', goodCount: 0, badCount: 0 },
    };

    for (const r of records) {
      if (r.type === 'good') stats[r.category].goodCount++;
      else stats[r.category].badCount++;
    }

    return [stats.body, stats.speech, stats.mind];
  }, [startDate]) ?? [];
}

export function useWeeklyTrend(weeks: number = 12) {
  return useLiveQuery(async () => {
    const startDate = getDaysAgo(weeks * 7);
    const records = await db.records.where('date').aboveOrEqual(startDate).toArray();

    const weekMap = new Map<string, { good: number; bad: number }>();

    for (const r of records) {
      const d = new Date(r.date);
      // Get Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      const weekKey = formatDate(monday);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { good: 0, bad: 0 });
      }
      const w = weekMap.get(weekKey)!;
      if (r.type === 'good') w.good++;
      else w.bad++;
    }

    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({ week, ...data }));
  }, [weeks]) ?? [];
}

export function useStreakDays() {
  return useLiveQuery(async () => {
    const records = await db.records.orderBy('date').toArray();
    if (records.length === 0) return 0;

    const dates = new Set(records.map((r) => r.date));
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      if (dates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }, []) ?? 0;
}

export function useTotalCounts() {
  return useLiveQuery(async () => {
    const records = await db.records.toArray();
    let good = 0;
    let bad = 0;
    for (const r of records) {
      if (r.type === 'good') good++;
      else bad++;
    }
    return { good, bad, net: good - bad };
  }, []) ?? { good: 0, bad: 0, net: 0 };
}
