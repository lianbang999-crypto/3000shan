import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Star,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import PageShell from '../components/layout/PageShell';
import { useAppStore } from '../stores/app';
import { useFavorites } from '../hooks/useFavorites';
import {
  useRecordsByDate,
  useRecordedItemIds,
  toggleRecord,
  saveReflection,
  useReflection,
  updateRecordNote,
} from '../hooks/useRecords';
import { addCustomItem } from '../hooks/useItems';
import { addToFavorites } from '../hooks/useFavorites';
import { formatDateChinese, getToday, getDaysAgo } from '../utils/date';
import {
  CATEGORY_LABELS,
  CATEGORIES,
  BACKFILL_DAYS,
} from '../utils/constants';
import type { Category, ItemType } from '../utils/constants';
import type { DbItem } from '../db';

/* ------------------------------------------------------------------ */
/*  Date Picker                                                        */
/* ------------------------------------------------------------------ */

interface DatePickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

function DatePicker({ selectedDate, onSelect, onClose }: DatePickerProps) {
  const dates = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < BACKFILL_DAYS; i++) {
      result.push(getDaysAgo(i));
    }
    return result;
  }, []);

  return (
    <div className="absolute top-full left-0 right-0 z-30 bg-surface border-b border-border shadow-sm">
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        {dates.map((d) => {
          const isSelected = d === selectedDate;
          const isToday = d === getToday();
          return (
            <button
              key={d}
              onClick={() => {
                onSelect(d);
                onClose();
              }}
              className={`
                py-2 px-1 rounded-lg text-center text-sm transition-colors
                ${isSelected ? 'bg-accent-bg text-accent font-medium' : 'text-text-secondary hover:bg-surface'}
              `}
            >
              <div>{formatDateChinese(d).split(' ')[0]}</div>
              <div className="text-xs mt-0.5 text-text-muted">
                {isToday ? '今天' : formatDateChinese(d).split(' ')[1]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline Note Editor                                                 */
/* ------------------------------------------------------------------ */

interface NoteEditorProps {
  recordId: string;
  initialNote: string;
  onClose: () => void;
}

function NoteEditor({ recordId, initialNote, onClose }: NoteEditorProps) {
  const [note, setNote] = useState(initialNote);

  const handleBlur = useCallback(() => {
    void updateRecordNote(recordId, note.trim());
    onClose();
  }, [recordId, note, onClose]);

  return (
    <div className="mt-2 ml-8">
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={handleBlur}
        placeholder="添加备注..."
        rows={2}
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-accent"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Custom Item Form                                               */
/* ------------------------------------------------------------------ */

interface AddCustomFormProps {
  onDone: () => void;
}

function AddCustomForm({ onDone }: AddCustomFormProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<ItemType>('good');
  const [category, setCategory] = useState<Category>('mind');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const item = await addCustomItem(trimmed, type, category);
      await addToFavorites(item.id);
      setText('');
      onDone();
    } finally {
      setSubmitting(false);
    }
  }, [text, type, category, submitting, onDone]);

  return (
    <div className="mt-3 p-3 bg-surface rounded-xl border border-border space-y-3">
      <input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入自定义条目..."
        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void handleSubmit();
          }
        }}
      />

      <div className="flex items-center gap-3">
        {/* Type selector */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            onClick={() => setType('good')}
            className={`px-3 py-1.5 transition-colors ${
              type === 'good'
                ? 'bg-good-bg text-good font-medium'
                : 'text-text-secondary hover:bg-surface'
            }`}
          >
            功
          </button>
          <button
            onClick={() => setType('bad')}
            className={`px-3 py-1.5 transition-colors ${
              type === 'bad'
                ? 'bg-bad-bg text-bad font-medium'
                : 'text-text-secondary hover:bg-surface'
            }`}
          >
            过
          </button>
        </div>

        {/* Category selector */}
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 transition-colors ${
                category === cat
                  ? 'bg-accent-bg text-accent font-medium'
                  : 'text-text-secondary hover:bg-surface'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Confirm */}
        <button
          onClick={() => void handleSubmit()}
          disabled={!text.trim() || submitting}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-medium bg-accent-bg text-accent disabled:opacity-40 transition-opacity"
        >
          添加
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Favorite Item Row                                                  */
/* ------------------------------------------------------------------ */

interface FavoriteRowProps {
  item: DbItem;
  isChecked: boolean;
  recordId: string | undefined;
  recordNote: string;
  date: string;
}

function FavoriteRow({
  item,
  isChecked,
  recordId,
  recordNote,
  date,
}: FavoriteRowProps) {
  const [showNote, setShowNote] = useState(false);

  const handleToggle = useCallback(() => {
    void toggleRecord(item.id, date, item.type, item.category);
  }, [item.id, date, item.type, item.category]);

  const bgClass = isChecked
    ? item.type === 'good'
      ? 'bg-good-bg'
      : 'bg-bad-bg'
    : '';

  return (
    <div
      className={`rounded-xl px-3 py-2.5 transition-colors ${bgClass}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
            isChecked
              ? item.type === 'good'
                ? 'bg-good border-good text-white'
                : 'bg-bad border-bad text-white'
              : 'border-border'
          }`}
          aria-label={isChecked ? '取消记录' : '记录'}
        >
          {isChecked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-text leading-relaxed">
            {item.explanation || item.text}
          </div>
          {item.explanation && (
            <div className="text-xs text-text-muted mt-0.5 font-serif">
              {item.text}
            </div>
          )}
        </div>

        {/* Note toggle */}
        {isChecked && (
          <button
            onClick={() => setShowNote((prev) => !prev)}
            className={`mt-0.5 p-1 rounded transition-colors shrink-0 ${
              recordNote
                ? 'text-accent'
                : 'text-text-muted hover:text-text-secondary'
            }`}
            aria-label="添加备注"
          >
            <MessageSquare size={16} />
          </button>
        )}
      </div>

      {/* Note editor */}
      {showNote && isChecked && recordId && (
        <NoteEditor
          recordId={recordId}
          initialNote={recordNote}
          onClose={() => setShowNote(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Favorites Section                                                  */
/* ------------------------------------------------------------------ */

interface FavoritesSectionProps {
  date: string;
}

function FavoritesSection({ date }: FavoritesSectionProps) {
  const navigate = useNavigate();
  const favorites = useFavorites();
  const recordedIds = useRecordedItemIds(date);
  const records = useRecordsByDate(date);
  const [showAddForm, setShowAddForm] = useState(false);

  // Build a map from itemId to record for quick lookup
  const recordsByItemId = useMemo(() => {
    const map = new Map<string, { id: string; note: string }>();
    for (const r of records) {
      map.set(r.itemId, { id: r.id, note: r.note });
    }
    return map;
  }, [records]);

  // Group favorites by type: good first, then bad
  const grouped = useMemo(() => {
    const goodItems: typeof favorites = [];
    const badItems: typeof favorites = [];
    for (const fav of favorites) {
      if (fav.item?.type === 'good') {
        goodItems.push(fav);
      } else {
        badItems.push(fav);
      }
    }
    return { good: goodItems, bad: badItems };
  }, [favorites]);

  const hasFavorites = favorites.length > 0;

  if (!hasFavorites) {
    return (
      <section className="px-4 py-6">
        <div className="text-center py-10">
          <BookOpen size={36} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary text-sm mb-4">
            还没有常用条目，去条目库看看？
          </p>
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-bg text-accent text-sm font-medium transition-opacity hover:opacity-80"
          >
            <Star size={16} />
            浏览条目库
          </button>
        </div>

        {/* Still allow adding custom */}
        <div className="mt-2">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            <Plus size={16} />
            自定义条目
          </button>
          {showAddForm && (
            <AddCustomForm onDone={() => setShowAddForm(false)} />
          )}
        </div>
      </section>
    );
  }

  const renderGroup = (
    items: typeof favorites,
    label: string,
    typeClass: string
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <div
          className={`text-xs font-medium ${typeClass} mb-2 px-1 tracking-wide`}
        >
          {label}
        </div>
        <div className="space-y-1.5">
          {items.map(({ favorite, item }) => {
            if (!item) return null;
            const record = recordsByItemId.get(item.id);
            return (
              <FavoriteRow
                key={favorite.id}
                item={item}
                isChecked={recordedIds.has(item.id)}
                recordId={record?.id}
                recordNote={record?.note ?? ''}
                date={date}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="px-4 py-2">
      <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-1.5">
        <Star size={14} />
        我的常用
      </h2>

      {renderGroup(grouped.good, '功', 'text-good')}
      {renderGroup(grouped.bad, '过', 'text-bad')}

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <button
          onClick={() => navigate('/library')}
          className="text-sm text-accent hover:underline transition-colors"
        >
          从条目库添加更多
        </button>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`flex items-center gap-1 text-sm transition-colors ${
            showAddForm
              ? 'text-accent'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Plus size={16} />
          自定义
        </button>
      </div>

      {showAddForm && (
        <AddCustomForm onDone={() => setShowAddForm(false)} />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Reflection Section                                                 */
/* ------------------------------------------------------------------ */

interface ReflectionSectionProps {
  date: string;
}

function ReflectionSection({ date }: ReflectionSectionProps) {
  const reflection = useReflection(date);
  const [localText, setLocalText] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The displayed value: local draft if editing, otherwise DB value
  const displayText = localText ?? reflection?.text ?? '';

  const handleChange = useCallback(
    (value: string) => {
      setLocalText(value);
      // Debounce auto-save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void saveReflection(date, value.trim());
      }, 800);
    },
    [date]
  );

  const handleBlur = useCallback(() => {
    // Save immediately on blur
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const text = localText ?? '';
    void saveReflection(date, text.trim());
    setLocalText(null); // Reset to DB-driven value
  }, [date, localText]);

  return (
    <section className="px-4 py-4">
      <h2 className="text-sm font-medium text-text-secondary mb-2 flex items-center gap-1.5">
        <BookOpen size={14} />
        今日反思（选填）
      </h2>
      <textarea
        value={displayText}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="今天有什么感悟？"
        rows={3}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-accent leading-relaxed"
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary Bar                                                        */
/* ------------------------------------------------------------------ */

interface SummaryBarProps {
  date: string;
}

function SummaryBar({ date }: SummaryBarProps) {
  const records = useRecordsByDate(date);

  const counts = useMemo(() => {
    let good = 0;
    let bad = 0;
    for (const r of records) {
      if (r.type === 'good') good++;
      else bad++;
    }
    return { good, bad };
  }, [records]);

  return (
    <div className="sticky bottom-14 z-20 px-4 pb-2">
      <div className="bg-surface border border-border rounded-xl px-4 py-2.5 flex items-center justify-center gap-6 shadow-sm">
        <span className="text-sm text-text-secondary">今日</span>
        <span className="text-sm font-medium text-good">
          功 {counts.good}
        </span>
        <span className="text-sm font-medium text-bad">
          过 {counts.bad}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecordPage (main)                                                  */
/* ------------------------------------------------------------------ */

export default function RecordPage() {
  const currentDate = useAppStore((s) => s.currentDate);
  const setCurrentDate = useAppStore((s) => s.setCurrentDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isToday = currentDate === getToday();
  const dateLabel = isToday
    ? `${formatDateChinese(currentDate)} ・ 今天`
    : formatDateChinese(currentDate);

  return (
    <PageShell title="记录">
      <div className="pb-20">
        {/* Date header */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-text-secondary hover:text-text transition-colors"
          >
            <Calendar size={16} />
            <span className="text-sm">{dateLabel}</span>
            {showDatePicker ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          {showDatePicker && (
            <DatePicker
              selectedDate={currentDate}
              onSelect={setCurrentDate}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>

        {/* Favorites / checklist */}
        <FavoritesSection date={currentDate} />

        {/* Divider */}
        <div className="mx-4 border-t border-border" />

        {/* Reflection */}
        <ReflectionSection date={currentDate} />

        {/* Summary bar */}
        <SummaryBar date={currentDate} />
      </div>
    </PageShell>
  );
}
