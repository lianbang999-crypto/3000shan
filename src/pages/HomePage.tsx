import { useNavigate } from 'react-router-dom';
import { useTotalGoodCount, useRecordsByDate } from '../hooks/useRecords';
import { useStreakDays } from '../hooks/useStats';
import { useAppStore } from '../stores/app';
import { getToday, getLunarGreeting, formatDateChinese } from '../utils/date';
import { ClipboardCheck, TrendingUp, BookOpen } from 'lucide-react';
import { CATEGORY_LABELS } from '../utils/constants';
import type { Category } from '../utils/constants';

export default function HomePage() {
  const navigate = useNavigate();
  const today = getToday();
  const goal = useAppStore((s) => s.goal);

  const totalGood = useTotalGoodCount();
  const streak = useStreakDays();
  const todayRecords = useRecordsByDate(today);

  const greeting = getLunarGreeting();
  const dateDisplay = formatDateChinese(today);

  // Today's counts
  const todayGood = todayRecords.filter((r) => r.type === 'good').length;
  const todayBad = todayRecords.filter((r) => r.type === 'bad').length;
  const hasRecordsToday = todayRecords.length > 0;

  // Category breakdown for today
  const categoryBreakdown = (['body', 'speech', 'mind'] as Category[]).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    count: todayRecords.filter((r) => r.category === cat).length,
  }));

  // Progress percentage (clamped to 100)
  const progressPercent = Math.min((totalGood / goal) * 100, 100);

  return (
    <div className="page-content pb-20">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="font-classic text-2xl text-text tracking-wide">三千善</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-secondary">{dateDisplay}</p>
          <p className="text-xs text-text-muted mt-0.5">{greeting}</p>
        </div>
      </header>

      {/* Progress card */}
      <section className="mx-5 mt-2 p-5 bg-surface rounded-2xl border border-border">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-light text-good tabular-nums">
            {totalGood.toLocaleString()}
          </span>
          <span className="text-sm text-text-muted">/ {goal.toLocaleString()} 善行</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-good-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-good rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-text-muted">
          <TrendingUp size={14} className="shrink-0" />
          <span className="text-xs">
            {streak > 0
              ? `连续记录 ${streak} 天`
              : '今天开始你的第一次记录'}
          </span>
        </div>
      </section>

      {/* Today's status card */}
      <section className="mx-5 mt-4 p-5 bg-surface rounded-2xl border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck size={16} className="text-text-secondary" />
          <h2 className="text-sm font-medium text-text">今日</h2>
        </div>

        {hasRecordsToday ? (
          <div className="space-y-3">
            <div className="flex items-baseline gap-6">
              <div>
                <span className="text-2xl font-light text-good tabular-nums">{todayGood}</span>
                <span className="text-xs text-text-muted ml-1">功</span>
              </div>
              <div>
                <span className="text-2xl font-light text-accent tabular-nums">{todayBad}</span>
                <span className="text-xs text-text-muted ml-1">过</span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="flex items-center gap-4 pt-1">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">{item.label}</span>
                  <span className="text-xs text-text-secondary tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-text-muted">还未记录</p>
            <p className="text-xs text-text-muted mt-1 opacity-70">
              每一次觉察，都是修行的开始
            </p>
          </div>
        )}
      </section>

      {/* Quick action button */}
      <div className="mx-5 mt-6">
        <button
          onClick={() => navigate('/record')}
          className="w-full py-3.5 bg-good-bg text-good rounded-xl text-sm font-medium
                     hover:brightness-95 active:scale-[0.98] transition-all duration-150"
        >
          <span className="flex items-center justify-center gap-2">
            <BookOpen size={16} />
            开始今日记录
          </span>
        </button>
      </div>
    </div>
  );
}
