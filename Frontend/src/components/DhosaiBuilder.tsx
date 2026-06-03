import { useState } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { DEFAULT_PRICES } from '../constants';

interface DhosaiBuilderProps {
  key?: string | number;
  language: Language;
  prices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
}

export function DhosaiBuilder({ language, prices, onAdd, onComplete }: DhosaiBuilderProps) {
  const t = translations[language];

  const dbBeefPrice = prices.dhosaBeef ?? DEFAULT_PRICES.dhosaBeef;
  const dbExtraPrice = prices.dhosaExtra ?? DEFAULT_PRICES.dhosaExtra;

  const [baseType, setBaseType] = useState<'beef' | 'extra'>('beef');
  const [subType, setSubType] = useState<'beef' | 'chicken' | 'egg'>('beef');
  const [price, setPrice] = useState<string>(String(dbBeefPrice));

  const resetState = () => {
    setBaseType('beef');
    setSubType('beef');
    setPrice(String(dbBeefPrice));
  };

  const handleBaseTypeChange = (type: 'beef' | 'extra') => {
    setBaseType(type);
    setPrice(String(type === 'beef' ? dbBeefPrice : dbExtraPrice));
  };

  const createItem = (): BillItem => {
    return {
      id: crypto.randomUUID(),
      categoryId: 'dhosai',
      baseType: baseType,
      subType: baseType === 'extra' ? subType : undefined,
      proteins: [],
      price: Number(price) || 0,
    };
  };

  const handleAddClick = () => {
    if (Number(price) <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    onAdd(createItem());
    resetState();
  };

  const handleCompleteClick = () => {
    if (Number(price) <= 0) {
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
          {/* STEP 1: Type */}
          <div className="option-group">
            <span className="option-label">Base</span>
            <div className="option-row">
              {['beef', 'extra'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleBaseTypeChange(type as 'beef' | 'extra')}
                  className={`option-btn font-heading font-semibold transition-all
                    ${baseType === type
                      ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                      : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                    }
                  `}
                >
                  {t[type as keyof typeof t]}
                </button>
              ))}
            </div>
          </div>

          {/* EXTRA Sub-type */}
          {baseType === 'extra' && (
            <div className="option-group">
              <span className="option-label">Protein</span>
              <div className="option-row">
                {['beef', 'chicken', 'egg'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubType(sub as any)}
                    className={`option-btn font-heading font-semibold transition-all
                      ${subType === sub
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                  >
                    {t[sub as keyof typeof t]}
                  </button>
                ))}
              </div>
            </div>
          )}
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
