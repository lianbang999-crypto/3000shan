import { useState, useMemo } from 'react';
import PageShell from '../components/layout/PageShell';
import { useItems } from '../hooks/useItems';
import { useFavoriteIds, addToFavorites, removeFromFavorites } from '../hooks/useFavorites';
import { CATEGORY_LABELS, CATEGORIES } from '../utils/constants';
import type { Category, ItemType } from '../utils/constants';
import { Star, StarOff, Search, X } from 'lucide-react';

const TYPE_OPTIONS: { value: ItemType | undefined; label: string }[] = [
  { value: undefined, label: '全部' },
  { value: 'good', label: '功' },
  { value: 'bad', label: '过' },
];

const CATEGORY_OPTIONS: { value: Category | undefined; label: string }[] = [
  { value: undefined, label: '全部' },
  ...CATEGORIES.map((c) => ({ value: c as Category, label: CATEGORY_LABELS[c] })),
];

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<ItemType | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const items = useItems(selectedCategory, selectedType);
  const favoriteIds = useFavoriteIds();

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  function handleToggleFavorite(itemId: string) {
    if (favoriteIds.has(itemId)) {
      removeFromFavorites(itemId);
    } else {
      addToFavorites(itemId);
    }
  }

  return (
    <PageShell title="条目库" showBack={true}>
      <div className="px-4 pt-3 pb-2 space-y-3">
        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedCategory(opt.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCategory === opt.value
                  ? 'bg-accent-bg text-accent font-medium'
                  : 'bg-surface text-text-muted border border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSelectedType(opt.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedType === opt.value
                  ? 'bg-accent-bg text-accent font-medium'
                  : 'bg-surface text-text-muted border border-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索条目内容或释义…"
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Item count */}
      <div className="px-4 py-1">
        <span className="text-xs text-text-muted">共 {filteredItems.length} 条</span>
      </div>

      {/* Item list */}
      <div className="px-4 pb-4 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
            没有找到匹配的条目
          </div>
        ) : (
          filteredItems.map((item) => {
            const isFavorite = favoriteIds.has(item.id);
            const isGood = item.type === 'good';

            return (
              <div
                key={item.id}
                className={`bg-surface rounded-lg border border-border overflow-hidden flex ${
                  isGood ? 'border-l-good' : 'border-l-bad'
                }`}
                style={{ borderLeftWidth: '3px' }}
              >
                <div className="flex-1 py-3 pl-3 pr-2">
                  {/* Classical text */}
                  <p className="font-classic text-classic text-base leading-relaxed">
                    {item.text}
                  </p>

                  {/* Explanation */}
                  {item.explanation && (
                    <p className="text-text-secondary text-sm mt-1 leading-relaxed">
                      {item.explanation}
                    </p>
                  )}

                  {/* Badge row */}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        isGood
                          ? 'bg-good-bg text-good'
                          : 'bg-bad-bg text-bad'
                      }`}
                    >
                      {isGood ? '功' : '过'}{' '}
                      {isGood
                        ? `+${item.referenceScore}`
                        : `-${item.referenceScore}`}
                    </span>
                    {item.source && (
                      <span className="text-xs text-text-muted">{item.source}</span>
                    )}
                  </div>
                </div>

                {/* Favorite toggle */}
                <button
                  onClick={() => handleToggleFavorite(item.id)}
                  className="flex items-start pt-3 pr-3 pl-1 shrink-0 text-text-muted hover:text-accent transition-colors"
                  aria-label={isFavorite ? '取消收藏' : '收藏'}
                >
                  {isFavorite ? (
                    <Star size={18} className="text-accent fill-accent" />
                  ) : (
                    <StarOff size={18} />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
