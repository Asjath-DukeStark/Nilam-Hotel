import { useState, useEffect } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { DEFAULT_PRICES } from '../constants';

interface GravyBuilderProps {
  key?: string | number;
  language: Language;
  prices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  initialItem?: BillItem;
}

export function GravyBuilder({ language, prices, onAdd, onComplete, initialItem }: GravyBuilderProps) {
  const t = translations[language];

  // sizeMode values: 'onePortion', 'halfPortion', 'manual'
  const [portion, setPortion] = useState<string>(() => initialItem?.sizeMode || 'onePortion');
  const [price, setPrice] = useState<string>(() => initialItem ? String(initialItem.price) : '0');

  useEffect(() => {
    let key = '';
    if (portion === 'onePortion') {
      key = 'gravyOnePortion';
    } else if (portion === 'halfPortion') {
      key = 'gravyHalfPortion';
    } else {
      // manual
      // Keep price state as is or reset to '0' only if it's changing to manual.
      // Wait, let's see. If changing to manual, set price to '0' (or keep current custom price).
      // If we are editing and portion matches initial portion, we do nothing.
      if (initialItem && portion === initialItem.sizeMode) {
        return;
      }
      setPrice('0');
      return;
    }

    const val = prices[key] ?? DEFAULT_PRICES[key as keyof typeof DEFAULT_PRICES] ?? 0;
    
    // Only update automatically if not the initial load of edited item
    if (initialItem && portion === initialItem.sizeMode) {
      return;
    }
    setPrice(String(val));
  }, [portion, prices]);

  const resetState = () => {
    setPortion('onePortion');
  };

  const createItem = (): BillItem => {
    return {
      id: initialItem?.id || crypto.randomUUID(),
      categoryId: 'gravy',
      sizeMode: portion,
      proteins: [],
      price: Number(price) || 0,
    };
  };

  const handleAddClick = () => {
    if (Number(price) <= 0 && portion !== 'manual') {
      // Allow manual price to be 0 or check if they want to override.
      // But let's keep the standard validation for safety.
      alert('Price must be greater than 0');
      return;
    }
    onAdd(createItem());
    resetState();
  };

  const handleCompleteClick = () => {
    if (Number(price) <= 0 && portion !== 'manual') {
      alert('Price must be greater than 0');
      return;
    }
    onComplete(createItem());
    resetState();
  };

  return (
    <>
      <div className="option-area mb-2 no-scrollbar">
        <div className="flex flex-col">
          {/* Portion Selection */}
          <div className="option-group">
            <span className="option-label">{t.gravy}</span>
            <div className="option-row flex-wrap gap-2">
              {[
                { id: 'onePortion', label: t.onePortion },
                { id: 'halfPortion', label: t.halfPortion },
                { id: 'manual', label: t.manual },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPortion(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${portion === opt.id
                      ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                      : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Numpad Area */}
      <div className="shrink-0 flex flex-col gap-[6px]">
        <Numpad value={price} onChange={setPrice} mode="price" language={language} />
        
        <button
          onClick={handleAddClick}
          className="w-full action-btn bg-brand-charcoal text-white font-heading active:scale-95 transition-transform hover:bg-black uppercase shadow-sm"
        >
          {t.add}
        </button>
        <button
          onClick={handleCompleteClick}
          className="w-full action-btn bg-brand-primary text-white font-heading active:scale-95 transition-transform hover:bg-amber-700 uppercase shadow-sm"
        >
          {t.complete}
        </button>
      </div>
    </>
  );
}
