import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../stores/app';
import { db } from '../db';
import { useSystemItems } from '../hooks/useItems';
import { addToFavorites } from '../hooks/useFavorites';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Heart,
  Compass,
} from 'lucide-react';
import type { DbItem } from '../db';

/** Hardcoded `text` values for the curated starter set (body/speech/mind, good/bad mix). */
const STARTER_GOOD_TEXTS: string[] = [
  // body-good
  '敬奉父母',
  '让路于人',
  '敬老慈幼',
  '惜谷惜纸',
  '济人之急',
  '助人成好事',
  // speech-good
  '言必忠信',
  '称人之善',
  '言语温和',
  '慰人愁苦',
  // mind-good
  '见人之得，如己之得',
  '不炫己长',
  '不嫉人之能',
  '受辱不怨',
  '不念旧恶',
  '闻过自省',
];

const STARTER_BAD_TEXTS: string[] = [
  // body-bad
  '暴殄天物',
  '损人利己',
  '负约失信',
  '用物不节',
  // speech-bad
  '妄言',
  '恶口骂人',
  '嘲讽他人',
  '扬人之恶',
  // mind-bad
  '嫉人之能',
  '怨天尤人',
  '念怨不休',
  '知过不改',
];

const STARTER_TEXTS = new Set([...STARTER_GOOD_TEXTS, ...STARTER_BAD_TEXTS]);

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`inline-block rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-accent'
              : i < current
                ? 'w-2 h-2 bg-accent/40'
                : 'w-2 h-2 bg-border'
          }`}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
      <div className="mb-6">
        <BookOpen size={28} className="mx-auto text-accent/60 mb-4" />
        <span className="font-classic text-4xl text-accent leading-none">善</span>
      </div>

      <h1 className="font-classic text-3xl text-text tracking-widest mb-2">三千善</h1>
      <p className="text-text-secondary text-sm mb-8">每日自省与行善记录</p>

      <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
        三百多年前，袁了凡先生发愿行三千善事，用功过格记录每日功过，最终改变了被算定的命运。三千善把这套方法变成了每个人都能用的现代工具。
      </p>

      <div className="mt-auto pb-10 w-full max-w-xs">
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                     bg-accent-bg text-accent text-sm font-medium
                     hover:brightness-95 active:scale-[0.98] transition-all duration-150"
        >
          下一步
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function HowItWorksStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const points = [
    {
      icon: Heart,
      title: '设置常用条目',
      desc: '把你每天可能做到的善行加入常用列表',
    },
    {
      icon: Check,
      title: '每日记录',
      desc: '睡前花几分钟，勾选今天做到的功与过',
    },
    {
      icon: Compass,
      title: '持续改善',
      desc: '觉察起心动念，逐步改过迁善',
    },
  ] as const;

  return (
    <div className="flex flex-col flex-1 px-8">
      <div className="flex-1 flex flex-col justify-center">
        <h2 className="font-classic text-2xl text-text text-center mb-10 tracking-wide">
          如何使用
        </h2>

        <div className="space-y-8 max-w-sm mx-auto w-full">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div key={idx} className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-accent-bg flex items-center justify-center">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-text font-medium text-sm">{pt.title}</p>
                  <p className="text-text-secondary text-sm mt-0.5 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pb-10 flex items-center gap-3 w-full max-w-sm mx-auto">
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 py-3.5 px-4 rounded-xl
                     text-text-muted text-sm
                     hover:bg-surface active:scale-[0.98] transition-all duration-150"
        >
          <ChevronLeft size={16} />
          上一步
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                     bg-accent-bg text-accent text-sm font-medium
                     hover:brightness-95 active:scale-[0.98] transition-all duration-150"
        >
          下一步
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StarterItemsStep({
  onComplete,
  onBack,
}: {
  onComplete: (selectedIds: string[]) => void;
  onBack: () => void;
}) {
  const systemItems = useSystemItems();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Pick the curated starter items from the full system items list.
  const { goodItems, badItems } = useMemo(() => {
    if (!systemItems || systemItems.length === 0) return { goodItems: [], badItems: [] };

    const curated = systemItems.filter((item) => STARTER_TEXTS.has(item.text));

    const good: DbItem[] = [];
    const bad: DbItem[] = [];
    for (const item of curated) {
      if (item.type === 'good') good.push(item);
      else bad.push(item);
    }

    // Sort within group: body -> speech -> mind for consistency.
    const catOrder: Record<string, number> = { body: 0, speech: 1, mind: 2 };
    const sorter = (a: DbItem, b: DbItem) =>
      (catOrder[a.category] ?? 9) - (catOrder[b.category] ?? 9);
    good.sort(sorter);
    bad.sort(sorter);

    return { goodItems: good, badItems: bad };
  }, [systemItems]);

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header area (fixed) */}
      <div className="px-6 pt-2 pb-3 shrink-0">
        <h2 className="font-classic text-2xl text-text text-center tracking-wide">
          选择常用条目
        </h2>
        <p className="text-text-secondary text-sm text-center mt-2 leading-relaxed">
          选择一些你想每天关注的条目，之后可以随时调整
        </p>
      </div>

      {/* Scrollable items */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
        {/* Good items */}
        <div className="mb-5">
          <h3 className="text-good text-xs font-medium tracking-wider mb-2 px-1">
            推荐功目
          </h3>
          <div className="space-y-2">
            {goodItems.map((item) => (
              <ItemCheckbox
                key={item.id}
                item={item}
                checked={selected.has(item.id)}
                onToggle={toggleItem}
              />
            ))}
          </div>
        </div>

        {/* Bad items */}
        <div>
          <h3 className="text-bad text-xs font-medium tracking-wider mb-2 px-1">
            推荐过目
          </h3>
          <div className="space-y-2">
            {badItems.map((item) => (
              <ItemCheckbox
                key={item.id}
                item={item}
                checked={selected.has(item.id)}
                onToggle={toggleItem}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer actions (fixed) */}
      <div className="shrink-0 px-6 pt-3 pb-8 border-t border-border bg-bg">
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1 py-3.5 px-4 rounded-xl
                       text-text-muted text-sm
                       hover:bg-surface active:scale-[0.98] transition-all duration-150"
          >
            <ChevronLeft size={16} />
            上一步
          </button>
          <button
            onClick={() => onComplete(Array.from(selected))}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                       bg-good-bg text-good text-sm font-medium
                       hover:brightness-95 active:scale-[0.98] transition-all duration-150"
          >
            <Check size={16} />
            完成{selectedCount > 0 ? `（已选 ${selectedCount} 条）` : ''}
          </button>
        </div>
        <button
          onClick={() => onComplete([])}
          className="block mx-auto mt-3 text-text-muted text-xs hover:text-text-secondary transition-colors"
        >
          跳过，稍后设置
        </button>
      </div>
    </div>
  );
}

function ItemCheckbox({
  item,
  checked,
  onToggle,
}: {
  item: DbItem;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  const isGood = item.type === 'good';

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      className={`w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left
                  transition-all duration-200
                  ${
                    checked
                      ? isGood
                        ? 'bg-good-bg border-good/20'
                        : 'bg-bad-bg border-bad/20'
                      : 'bg-surface border-border hover:border-accent/30'
                  }`}
    >
      {/* Checkbox */}
      <span
        className={`shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center
                    transition-all duration-200
                    ${
                      checked
                        ? isGood
                          ? 'bg-good border-good text-white'
                          : 'bg-bad border-bad text-white'
                        : 'border-border'
                    }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-classic text-sm leading-relaxed ${
            checked ? (isGood ? 'text-good' : 'text-bad') : 'text-classic'
          }`}
        >
          {item.text}
        </p>
        {item.explanation && (
          <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
            {item.explanation}
          </p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const completeOnboarding = useCallback(async (selectedIds: string[]) => {
    // Add each selected item to favorites
    for (const id of selectedIds) {
      await addToFavorites(id);
    }
    // Persist onboarded flag
    await db.settings.put({ key: 'onboarded', value: true });
    // Update in-memory store
    useAppStore.getState().setOnboarded(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto">
      <StepIndicator current={step} total={3} />

      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}

      {step === 1 && (
        <HowItWorksStep onNext={() => setStep(2)} onBack={() => setStep(0)} />
      )}

      {step === 2 && (
        <StarterItemsStep onComplete={completeOnboarding} onBack={() => setStep(1)} />
      )}
    </div>
  );
}
