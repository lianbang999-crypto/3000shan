import { useState, useRef } from 'react';
import PageShell from '../components/layout/PageShell';
import { useAppStore } from '../stores/app';
import { db } from '../db';
import { seedDatabase } from '../db/seed';
import { useTotalCounts } from '../hooks/useStats';
import { useAllRecords } from '../hooks/useRecords';
import { useItems } from '../hooks/useItems';
import { exportToJSON, exportToCSV, downloadFile } from '../utils/export';
import type { DeedItem, DailyRecord } from '../utils/export';
import {
  Download,
  Moon,
  Sun,
  Target,
  Trash2,
  Info,
  ChevronRight,
} from 'lucide-react';

export default function ProfilePage() {
  const { good, bad, net } = useTotalCounts();
  const goal = useAppStore((s) => s.goal);
  const setGoal = useAppStore((s) => s.setGoal);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const allRecords = useAllRecords();
  const allItems = useItems();

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goal));
  const [showExportOptions, setShowExportOptions] = useState(false);
  const goalInputRef = useRef<HTMLInputElement>(null);

  // --- Goal editing ---
  function handleGoalTap() {
    setGoalInput(String(goal));
    setIsEditingGoal(true);
    setTimeout(() => goalInputRef.current?.focus(), 0);
  }

  async function handleGoalSave() {
    setIsEditingGoal(false);
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setGoal(parsed);
      await db.settings.put({ key: 'goal', value: parsed });
    } else {
      setGoalInput(String(goal));
    }
  }

  // --- Theme toggle ---
  async function handleThemeToggle() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await db.settings.put({ key: 'theme', value: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // --- Export ---
  function handleExportJSON() {
    const json = exportToJSON(
      allRecords as DailyRecord[],
      allItems as DeedItem[],
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(json, `三千善_${date}.json`, 'application/json');
    setShowExportOptions(false);
  }

  function handleExportCSV() {
    const csv = exportToCSV(
      allRecords as DailyRecord[],
      allItems as DeedItem[],
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `三千善_${date}.csv`, 'text/csv');
    setShowExportOptions(false);
  }

  // --- Clear data ---
  async function handleClearData() {
    const confirmed = window.confirm(
      '确定要清除所有数据吗？此操作不可撤销。所有记录、自定义条目和设置都将被删除。',
    );
    if (!confirmed) return;

    await db.records.clear();
    await db.reflections.clear();
    await db.favorites.clear();
    await db.items.clear();
    await db.settings.clear();
    await seedDatabase();
    setOnboarded(false);
    setGoal(3000);
    setTheme('light');
    document.documentElement.classList.remove('dark');
  }

  return (
    <PageShell title="我的">
      <div className="pb-20">
        {/* User stats summary */}
        <section className="mx-5 mt-5 p-5 bg-surface rounded-2xl border border-border">
          <h2 className="text-sm font-medium text-text-secondary mb-4">
            累计统计
          </h2>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-2xl font-light text-good tabular-nums">
                {good.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">总善行</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p className="text-2xl font-light text-accent tabular-nums">
                {bad.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">总过失</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p
                className={`text-2xl font-light tabular-nums ${
                  net >= 0 ? 'text-good' : 'text-bad'
                }`}
              >
                {net >= 0 ? '+' : ''}
                {net.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted mt-1">净善行</p>
            </div>
          </div>
        </section>

        {/* Goal setting */}
        <section className="mx-5 mt-4 p-5 bg-surface rounded-2xl border border-border">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={!isEditingGoal ? handleGoalTap : undefined}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-good-bg flex items-center justify-center">
                <Target size={16} className="text-good" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">善行目标</p>
                <p className="text-xs text-text-muted mt-0.5">
                  发愿行善的总数
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <input
                  ref={goalInputRef}
                  type="number"
                  min={1}
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onBlur={handleGoalSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGoalSave();
                  }}
                  className="w-20 text-right text-sm text-text bg-bg border border-border
                             rounded-lg px-2 py-1 outline-none focus:border-good
                             transition-colors tabular-nums"
                />
              ) : (
                <>
                  <span className="text-sm text-text-secondary tabular-nums">
                    {goal.toLocaleString()}
                  </span>
                  <ChevronRight size={16} className="text-text-muted" />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Settings section */}
        <section className="mx-5 mt-6">
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
            设置
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="w-full flex items-center justify-between px-5 py-4
                         hover:bg-bg/50 active:bg-bg/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-good-bg flex items-center justify-center">
                  {theme === 'light' ? (
                    <Sun size={16} className="text-good" />
                  ) : (
                    <Moon size={16} className="text-good" />
                  )}
                </div>
                <span className="text-sm font-medium text-text">主题</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  {theme === 'light' ? '浅色' : '深色'}
                </span>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </button>

            {/* Data export */}
            <div>
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="w-full flex items-center justify-between px-5 py-4
                           hover:bg-bg/50 active:bg-bg/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-good-bg flex items-center justify-center">
                    <Download size={16} className="text-good" />
                  </div>
                  <span className="text-sm font-medium text-text">
                    数据导出
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className={`text-text-muted transition-transform duration-200 ${
                    showExportOptions ? 'rotate-90' : ''
                  }`}
                />
              </button>
              {showExportOptions && (
                <div className="px-5 pb-4 flex gap-3">
                  <button
                    onClick={handleExportJSON}
                    className="flex-1 py-2.5 text-sm font-medium text-good bg-good-bg
                               rounded-xl hover:brightness-95 active:scale-[0.98]
                               transition-all duration-150"
                  >
                    导出 JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 py-2.5 text-sm font-medium text-good bg-good-bg
                               rounded-xl hover:brightness-95 active:scale-[0.98]
                               transition-all duration-150"
                  >
                    导出 CSV
                  </button>
                </div>
              )}
            </div>

            {/* Clear data */}
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between px-5 py-4
                         hover:bg-bad-bg/30 active:bg-bad-bg/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-bad-bg flex items-center justify-center">
                  <Trash2 size={16} className="text-bad" />
                </div>
                <span className="text-sm font-medium text-bad">清除数据</span>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </button>
          </div>
        </section>

        {/* About section */}
        <section className="mx-5 mt-6">
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
            关于
          </h2>
          <div className="bg-surface rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-good-bg flex items-center justify-center">
                <Info size={16} className="text-good" />
              </div>
              <h3 className="text-sm font-medium text-text">关于三千善</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              三千善 — 每日自省与行善记录工具
            </p>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              灵感来自《了凡四训》，袁了凡先生发愿行三千善事，改变了被算定的命运。
            </p>
            <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border">
              P0 v0.1.0
            </p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
