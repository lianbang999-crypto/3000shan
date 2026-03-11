import { useMemo } from 'react';
import PageShell from '../components/layout/PageShell';
import { BarChart3 } from 'lucide-react';
import {
  useDayStats,
  useCategoryStats,
  useWeeklyTrend,
  useTotalCounts,
  useStreakDays,
} from '../hooks/useStats';
import type { Category } from '../utils/constants';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const CATEGORY_FULL_LABELS: Record<Category, string> = {
  body: '身业',
  speech: '口业',
  mind: '意业',
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

/** Build the 90-day calendar grid data (columns = weeks, rows = Mon-Sun). */
function buildCalendarGrid(dayStats: { date: string; goodCount: number; badCount: number }[]) {
  const statsMap = new Map(dayStats.map((d) => [d.date, d]));

  const today = new Date();
  // We'll show ~90 days, but align to full weeks.
  // Walk back to find the Monday 12-13 weeks ago.
  const endDate = new Date(today);
  // Go to this week's Sunday (end of row)
  const endDow = endDate.getDay(); // 0=Sun
  const daysUntilSunday = endDow === 0 ? 0 : 7 - endDow;
  endDate.setDate(endDate.getDate() + daysUntilSunday);

  // Start from ~13 weeks before that Sunday's Monday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 13 * 7 + 1); // Monday of first week

  const weeks: {
    dateStr: string;
    goodCount: number;
    badCount: number;
    isFuture: boolean;
  }[][] = [];
  let currentWeek: typeof weeks[0] = [];

  const cursor = new Date(startDate);
  const todayStr = fmt(today);

  while (cursor <= endDate) {
    const dateStr = fmt(cursor);
    const stat = statsMap.get(dateStr);
    const isFuture = dateStr > todayStr;

    currentWeek.push({
      dateStr,
      goodCount: stat?.goodCount ?? 0,
      badCount: stat?.badCount ?? 0,
      isFuture,
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Extract month labels with column positions
  const monthLabels: { label: string; col: number }[] = [];
  let prevMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    // Use the Monday (first day) of each week
    const d = new Date(weeks[w][0].dateStr + 'T00:00:00');
    const month = d.getMonth();
    if (month !== prevMonth) {
      const monthNames = [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月',
      ];
      monthLabels.push({ label: monthNames[month], col: w });
      prevMonth = month;
    }
  }

  return { weeks, monthLabels };
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function heatmapColor(goodCount: number, badCount: number, isFuture: boolean): string {
  if (isFuture) return 'rgba(0,0,0,0.03)';
  if (goodCount === 0 && badCount === 0) return 'rgba(0,0,0,0.06)';
  if (goodCount === 0 && badCount > 0) return 'rgba(180,160,140,0.25)';
  if (goodCount <= 2) return 'rgba(74,158,100,0.25)';
  if (goodCount <= 5) return 'rgba(74,158,100,0.50)';
  return 'rgba(74,158,100,0.80)';
}

function formatWeekLabel(weekStr: string): string {
  const d = new Date(weekStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function StatsPage() {
  const dayStats = useDayStats(90);
  const categoryStats = useCategoryStats();
  const weeklyTrend = useWeeklyTrend(8);
  const totals = useTotalCounts();
  const streak = useStreakDays();

  const isEmpty = totals.good === 0 && totals.bad === 0;

  const calendar = useMemo(() => buildCalendarGrid(dayStats), [dayStats]);

  // The last 8 weeks of weekly trend
  const recentWeeks = weeklyTrend.slice(-8);

  // Max value in weekly trend (for bar scaling)
  const weeklyMax = useMemo(
    () => Math.max(1, ...recentWeeks.map((w) => Math.max(w.good, w.bad))),
    [recentWeeks],
  );

  if (isEmpty) {
    return (
      <PageShell title="统计">
        <div className="flex flex-col items-center justify-center h-full px-8 pb-20">
          <div className="w-16 h-16 rounded-full bg-good-bg flex items-center justify-center mb-4">
            <BarChart3 size={24} className="text-good/50" />
          </div>
          <p className="text-text-secondary text-sm text-center font-medium mb-1">
            暂无统计数据
          </p>
          <p className="text-text-muted text-xs text-center leading-relaxed max-w-[200px]">
            开始记录功过后，这里会显示趋势和分析
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="统计">
      <div className="pb-20 overflow-y-auto">
        {/* ---- Summary Cards (horizontal scroll) ---- */}
        <section className="px-5 pt-5">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            <SummaryCard label="功" value={totals.good} colorClass="text-good" bgClass="bg-good-bg" />
            <SummaryCard label="过" value={totals.bad} colorClass="text-bad" bgClass="bg-bad-bg" />
            <SummaryCard
              label="净善行"
              value={totals.net}
              colorClass={totals.net >= 0 ? 'text-good' : 'text-bad'}
              bgClass="bg-accent-bg"
            />
            <SummaryCard label="连续天数" value={streak} colorClass="text-classic" bgClass="bg-surface" />
          </div>
        </section>

        {/* ---- Calendar Heatmap ---- */}
        <section className="mx-5 mt-6 p-4 bg-surface rounded-2xl border border-border">
          <h2 className="text-sm font-medium text-text mb-3">记录热力图</h2>

          {/* Month labels */}
          <div className="flex mb-1 ml-7" style={{ gap: 0 }}>
            {calendar.monthLabels.map((m, i) => {
              const nextCol = i < calendar.monthLabels.length - 1 ? calendar.monthLabels[i + 1].col : calendar.weeks.length;
              const span = nextCol - m.col;
              return (
                <span
                  key={`${m.label}-${m.col}`}
                  className="text-[10px] text-text-muted leading-none"
                  style={{ width: span * 14, flexShrink: 0 }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>

          {/* Grid: weekday labels + cells */}
          <div className="flex gap-0">
            {/* Weekday labels column */}
            <div className="flex flex-col shrink-0 mr-1" style={{ gap: 2 }}>
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="text-[10px] text-text-muted flex items-center justify-end"
                  style={{ width: 22, height: 12 }}
                >
                  {i % 2 === 0 ? label : ''}
                </div>
              ))}
            </div>

            {/* Heatmap cells: each column is a week */}
            <div className="flex" style={{ gap: 2 }}>
              {calendar.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      className="rounded-[2px]"
                      style={{
                        width: 12,
                        height: 12,
                        backgroundColor: heatmapColor(day.goodCount, day.badCount, day.isFuture),
                      }}
                      title={`${day.dateStr}: ${day.goodCount}功 ${day.badCount}过`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-7">
            <span className="text-[10px] text-text-muted">少</span>
            {[
              'rgba(0,0,0,0.06)',
              'rgba(74,158,100,0.25)',
              'rgba(74,158,100,0.50)',
              'rgba(74,158,100,0.80)',
            ].map((color) => (
              <div
                key={color}
                className="rounded-[2px]"
                style={{ width: 12, height: 12, backgroundColor: color }}
              />
            ))}
            <span className="text-[10px] text-text-muted">多</span>
          </div>
        </section>

        {/* ---- Category Breakdown (身口意) ---- */}
        <section className="mx-5 mt-4 p-4 bg-surface rounded-2xl border border-border">
          <h2 className="text-sm font-medium text-text mb-4">身口意分布</h2>

          <div className="space-y-4">
            {categoryStats.map((cat) => {
              const total = cat.goodCount + cat.badCount;
              const goodPct = total > 0 ? (cat.goodCount / total) * 100 : 0;
              const badPct = total > 0 ? (cat.badCount / total) * 100 : 0;

              return (
                <div key={cat.category}>
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-text">
                      {CATEGORY_FULL_LABELS[cat.category]}
                    </span>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-good">{cat.goodCount} 功</span>
                      <span className="text-text-muted">{cat.badCount} 过</span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="h-2.5 rounded-full overflow-hidden bg-good-bg flex">
                    {total > 0 ? (
                      <>
                        <div
                          className="h-full bg-good rounded-l-full transition-all duration-500"
                          style={{ width: `${goodPct}%` }}
                        />
                        <div
                          className="h-full bg-bad/30 transition-all duration-500"
                          style={{ width: `${badPct}%` }}
                        />
                      </>
                    ) : (
                      <div className="h-full w-full bg-border/30 rounded-full" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Weekly Trend ---- */}
        <section className="mx-5 mt-4 mb-4 p-4 bg-surface rounded-2xl border border-border">
          <h2 className="text-sm font-medium text-text mb-4">每周趋势</h2>

          {recentWeeks.length === 0 ? (
            <p className="text-xs text-text-muted py-2">数据不足，再记录几天后会显示趋势</p>
          ) : (
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {recentWeeks.map((week) => {
                const goodHeight = (week.good / weeklyMax) * 100;
                const badHeight = (week.bad / weeklyMax) * 100;

                return (
                  <div
                    key={week.week}
                    className="flex-1 flex flex-col items-center"
                  >
                    {/* Bars container */}
                    <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 100 }}>
                      {/* Good bar */}
                      <div
                        className="bg-good rounded-t-sm transition-all duration-500"
                        style={{
                          width: '40%',
                          height: `${Math.max(goodHeight, week.good > 0 ? 4 : 0)}%`,
                          minHeight: week.good > 0 ? 4 : 0,
                        }}
                      />
                      {/* Bad bar */}
                      <div
                        className="bg-bad/40 rounded-t-sm transition-all duration-500"
                        style={{
                          width: '40%',
                          height: `${Math.max(badHeight, week.bad > 0 ? 4 : 0)}%`,
                          minHeight: week.bad > 0 ? 4 : 0,
                        }}
                      />
                    </div>

                    {/* Week label */}
                    <span className="text-[10px] text-text-muted mt-1.5 leading-none">
                      {formatWeekLabel(week.week)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          {recentWeeks.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-good" />
                <span className="text-[10px] text-text-muted">功</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-bad/40" />
                <span className="text-[10px] text-text-muted">过</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  colorClass,
  bgClass,
}: {
  label: string;
  value: number;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div
      className={`shrink-0 px-4 py-3 rounded-xl border border-border ${bgClass}`}
      style={{ minWidth: 100 }}
    >
      <p className="text-[11px] text-text-muted mb-1">{label}</p>
      <p className={`text-2xl font-light tabular-nums ${colorClass}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
