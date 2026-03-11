import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTotalGoodCount, useRecordsByDate } from '../hooks/useRecords';
import { useStreakDays } from '../hooks/useStats';
import { useAppStore } from '../stores/app';
import { getToday, getLunarGreeting, formatDateChinese } from '../utils/date';
import { ClipboardCheck, TrendingUp, BookOpen, Eye } from 'lucide-react';

/** Classic awareness quotes — shown on the "觉察" button tap */
const AWARENESS_QUOTES = [
  { text: '一切福田，不离方寸', source: '六祖坛经' },
  { text: '知过能改，善莫大焉', source: '左传' },
  { text: '勿以善小而不为，勿以恶小而为之', source: '三国志' },
  { text: '但行好事，莫问前程', source: '增广贤文' },
  { text: '见人恶，即内省；有则改，无加警', source: '弟子规' },
  { text: '诸恶莫作，众善奉行，自净其意', source: '七佛通诫偈' },
  { text: '命由我作，福自己求', source: '了凡四训' },
  { text: '一念之善，吉神随之', source: '太上感应篇' },
  { text: '从前种种，譬如昨日死；从后种种，譬如今日生', source: '了凡四训' },
  { text: '起心动念，无不是业', source: '华严经' },
  { text: '满腔都是恻隐，方可为人', source: '警世功过格' },
  { text: '圣贤之道，惟诚与明', source: '了凡四训' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const today = getToday();
  const goal = useAppStore((s) => s.goal);

  const totalGood = useTotalGoodCount();
  const streak = useStreakDays();
  const todayRecords = useRecordsByDate(today);

  const [showQuote, setShowQuote] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const greeting = getLunarGreeting();
  const dateDisplay = formatDateChinese(today);

  // Today's counts
  const todayGood = todayRecords.filter((r) => r.type === 'good').length;
  const todayBad = todayRecords.filter((r) => r.type === 'bad').length;
  const hasRecordsToday = todayRecords.length > 0;

  // Progress percentage (clamped to 100)
  const progressPercent = Math.min((totalGood / goal) * 100, 100);

  const handleAwareness = () => {
    setQuoteIndex(Math.floor(Math.random() * AWARENESS_QUOTES.length));
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 4000);
  };

  const quote = AWARENESS_QUOTES[quoteIndex];

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

      {/* Awareness quote overlay */}
      {showQuote && (
        <div className="mx-5 mb-3 p-4 bg-accent-bg rounded-2xl border border-accent/10 animate-fade-in">
          <p className="font-classic text-accent text-base leading-relaxed text-center">
            {quote.text}
          </p>
          <p className="text-xs text-accent/60 text-center mt-1.5">
            ——《{quote.source}》
          </p>
        </div>
      )}

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
            style={{ width: `${Math.max(progressPercent, totalGood > 0 ? 1 : 0)}%` }}
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
                <span className="text-2xl font-light text-bad tabular-nums">{todayBad}</span>
                <span className="text-xs text-text-muted ml-1">过</span>
              </div>
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

      {/* Action buttons */}
      <div className="mx-5 mt-6 flex gap-3">
        {/* Main: start recording */}
        <button
          onClick={() => navigate('/record')}
          className="flex-1 py-3.5 bg-good-bg text-good rounded-xl text-sm font-medium
                     hover:brightness-95 active:scale-[0.98] transition-all duration-150"
        >
          <span className="flex items-center justify-center gap-2">
            <BookOpen size={16} />
            {hasRecordsToday ? '继续记录' : '开始今日记录'}
          </span>
        </button>

        {/* Awareness button */}
        <button
          onClick={handleAwareness}
          className="w-14 py-3.5 bg-accent-bg text-accent rounded-xl text-sm font-medium
                     hover:brightness-95 active:scale-[0.98] transition-all duration-150
                     flex items-center justify-center"
          aria-label="觉察"
          title="觉察 — 即时警语"
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  );
}
