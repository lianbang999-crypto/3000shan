import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '../stores/app';
import {
  useRecordsByDate,
  useReflection,
  addRecord,
  deleteRecord,
  updateRecordText,
  saveReflection,
} from '../hooks/useRecords';
import { formatDateChinese, getToday, getDaysAgo } from '../utils/date';
import { BACKFILL_DAYS } from '../utils/constants';
import type { ItemType } from '../utils/constants';
import type { DbRecord } from '../db';

/* ------------------------------------------------------------------ */
/*  EntryInput                                                         */
/* ------------------------------------------------------------------ */

function EntryInput({
  type,
  date,
  onClose,
}: {
  type: ItemType;
  date: string;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await addRecord(date, trimmed, type);
      setText('');
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }, [text, submitting, date, type]);

  const isGood = type === 'good';
  const borderColor = isGood ? 'border-good/30 focus-within:border-good/60' : 'border-bad/30 focus-within:border-bad/60';
  const placeholder = isGood ? '做了什么善事？' : '犯了什么过失？';

  return (
    <div className="px-5 pb-3 animate-fade-in">
      <div className={`flex items-center gap-2 bg-surface border ${borderColor} rounded-xl px-4 py-2.5 transition-colors`}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit(); }}
          placeholder={placeholder}
          className="flex-1 text-sm text-text bg-transparent placeholder:text-text-muted focus:outline-none"
        />
        <button
          onClick={() => void handleSubmit()}
          disabled={!text.trim() || submitting}
          className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors disabled:opacity-30 ${
            isGood ? 'text-good bg-good-bg' : 'text-bad bg-bad-bg'
          }`}
        >
          记录
        </button>
        <button
          onClick={onClose}
          className="text-xs text-text-muted px-1"
        >
          取消
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EntryRow                                                           */
/* ------------------------------------------------------------------ */

function EntryRow({ record }: { record: DbRecord }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(record.text);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartRef = useRef(0);
  const swipingRef = useRef(false);

  const handleSave = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== record.text) {
      void updateRecordText(record.id, trimmed);
    }
    setIsEditing(false);
  }, [editText, record.id, record.text]);

  const handleDelete = useCallback(() => {
    void deleteRecord(record.id);
  }, [record.id]);

  const handleTap = useCallback(() => {
    if (swipingRef.current) return;
    setEditText(record.text);
    setIsEditing(true);
  }, [record.text]);

  // Touch swipe
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    swipingRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartRef.current;
    if (Math.abs(dx) > 10) swipingRef.current = true;
    if (dx < 0) setSwipeX(Math.max(dx, -80));
    else if (swipeX < 0) setSwipeX(Math.min(0, dx + swipeX));
  }, [swipeX]);

  const onTouchEnd = useCallback(() => {
    setSwipeX(swipeX < -40 ? -72 : 0);
    setTimeout(() => { swipingRef.current = false; }, 50);
  }, [swipeX]);

  const isGood = record.type === 'good';
  const borderColor = isGood ? 'border-l-good' : 'border-l-bad/60';
  const time = new Date(record.createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="relative overflow-hidden">
      {swipeX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button onClick={handleDelete} className="h-full px-5 bg-red-400/90 text-white text-sm">
            删除
          </button>
        </div>
      )}

      <div
        className="relative"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`flex items-start gap-3 px-5 py-3 min-h-[44px] border-l-[3px] ${borderColor}`}>
          {isEditing ? (
            <input
              autoFocus
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setIsEditing(false); }}
              className="flex-1 text-sm text-text bg-surface border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent"
            />
          ) : (
            <button onClick={handleTap} className="flex-1 text-left">
              <span className="text-sm text-text leading-relaxed">{record.text}</span>
            </button>
          )}
          {!isEditing && (
            <span className="text-[11px] text-text-muted tabular-nums shrink-0 pt-0.5">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ReflectionInput                                                    */
/* ------------------------------------------------------------------ */

function ReflectionInput({ date }: { date: string }) {
  const reflection = useReflection(date);
  const [localText, setLocalText] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayText = localText ?? reflection?.text ?? '';

  const handleChange = useCallback((value: string) => {
    setLocalText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void saveReflection(date, value.trim());
    }, 800);
  }, [date]);

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    void saveReflection(date, (localText ?? '').trim());
    setLocalText(null);
  }, [date, localText]);

  return (
    <div className="px-5 pt-4 pb-4">
      <textarea
        value={displayText}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="今天有什么感悟？"
        rows={2}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-accent leading-relaxed"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecordPage                                                         */
/* ------------------------------------------------------------------ */

export default function RecordPage() {
  const currentDate = useAppStore((s) => s.currentDate);
  const setCurrentDate = useAppStore((s) => s.setCurrentDate);
  const [activeInput, setActiveInput] = useState<ItemType | null>(null);

  useEffect(() => { setCurrentDate(getToday()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = getToday();
  const isToday = currentDate === today;
  const dateLabel = formatDateChinese(currentDate) + (isToday ? ' · 今天' : '');

  const canGoBack = currentDate > getDaysAgo(BACKFILL_DAYS - 1);
  const canGoForward = currentDate < today;

  const goBack = useCallback(() => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const prev = d.toISOString().slice(0, 10);
    if (prev >= getDaysAgo(BACKFILL_DAYS - 1)) setCurrentDate(prev);
  }, [currentDate, setCurrentDate]);

  const goForward = useCallback(() => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().slice(0, 10);
    if (next <= today) setCurrentDate(next);
  }, [currentDate, setCurrentDate, today]);

  // Data
  const records = useRecordsByDate(currentDate);
  const goodCount = useMemo(() => records.filter((r) => r.type === 'good').length, [records]);
  const badCount = useMemo(() => records.filter((r) => r.type === 'bad').length, [records]);

  const handleActionButton = useCallback((type: ItemType) => {
    setActiveInput((prev) => (prev === type ? null : type));
  }, []);

  return (
    <div className="page-content pb-20">
      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4 pt-5 pb-3 px-5">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 text-text-muted disabled:opacity-20 transition-opacity"
          aria-label="前一天"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm text-text-secondary select-none">{dateLabel}</span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 text-text-muted disabled:opacity-20 transition-opacity"
          aria-label="后一天"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Count cards */}
      <div className="flex gap-3 px-5 pb-4">
        <div className="flex-1 flex items-baseline gap-2 py-3 px-4 bg-good-bg rounded-xl">
          <span className="text-xs text-good/70">功</span>
          <span className="text-2xl font-light text-good tabular-nums">{goodCount}</span>
        </div>
        <div className="flex-1 flex items-baseline gap-2 py-3 px-4 bg-bad-bg rounded-xl">
          <span className="text-xs text-bad/70">过</span>
          <span className="text-2xl font-light text-bad tabular-nums">{badCount}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-5 pb-3">
        <button
          onClick={() => handleActionButton('good')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            activeInput === 'good'
              ? 'bg-good text-white shadow-sm'
              : 'bg-good-bg text-good'
          }`}
        >
          <Plus size={16} />
          记功
        </button>
        <button
          onClick={() => handleActionButton('bad')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            activeInput === 'bad'
              ? 'bg-bad text-white shadow-sm'
              : 'bg-bad-bg text-bad'
          }`}
        >
          <Plus size={16} />
          记过
        </button>
      </div>

      {/* Inline input */}
      {activeInput && (
        <EntryInput
          type={activeInput}
          date={currentDate}
          onClose={() => setActiveInput(null)}
        />
      )}

      {/* Entry list */}
      {records.length > 0 ? (
        <div className="mt-1">
          {records.map((record) => (
            <EntryRow key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-text-muted">今天还没有记录</p>
          <p className="text-xs text-text-muted mt-1 opacity-60">点上方按钮，记一笔功或过</p>
        </div>
      )}

      {/* Reflection */}
      <ReflectionInput date={currentDate} />
    </div>
  );
}
