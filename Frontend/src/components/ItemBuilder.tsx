import { useState } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';

interface ItemBuilderProps {
  key?: string | number;
  category: string;
  language: Language;
  prices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
}

export function ItemBuilder({ category, language, prices, onAdd, onComplete }: ItemBuilderProps) {
  const t = translations[language];
  const isRice = category === 'rice';

  const normalPriceKey = category === 'kottu' ? 'kottuNormal' : category === 'dolphinKottu' ? 'dolphinNormal' : 'riceNormal';
  const fullPriceKey = category === 'kottu' ? 'kottuFull' : category === 'dolphinKottu' ? 'dolphinFull' : 'riceFull';

  const normalPrice = prices[normalPriceKey] ?? 350;
  const fullPrice = prices[fullPriceKey] ?? 500;

  const [baseType, setBaseType] = useState<string>('');
  const [proteins, setProteins] = useState<string[]>([]);
  const [sizeMode, setSizeMode] = useState<'normal' | 'full' | 'manual' | ''>('');
  const [price, setPrice] = useState<string>('');

  const handleBaseChange = (type: string) => setBaseType(type);

  const toggleProtein = (p: string) => {
    const isMultiSelect = sizeMode === 'manual';
    setProteins((prev) => {
      if (isMultiSelect) {
        return prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      } else {
        return prev.includes(p) ? [] : [p];
      }
    });
  };

  const handleSizeChange = (mode: 'normal' | 'full' | 'manual') => {
    setSizeMode(mode);
    if (mode === 'normal') setPrice(String(normalPrice));
    else if (mode === 'full') setPrice(String(fullPrice));
    else if (mode === 'manual') setPrice('');
    
    // When switching away from manual, make sure to clear if multiple or extra are selected
    if (mode !== 'manual') {
      setProteins((prev) => {
        if (prev.length > 1 || prev.includes('extra')) return [];
        return prev;
      });
    }
  };

  const resetState = () => {
    setBaseType('');
    setProteins([]);
    setSizeMode('');
    setPrice('');
  };

  const createItem = (): BillItem => {
    return {
      id: crypto.randomUUID(),
      categoryId: category,
      baseType: isRice ? undefined : baseType,
      proteins,
      sizeMode,
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
      {/* Option Area (Middle) */}
      <div className="option-area mb-2 no-scrollbar">
        <div className="flex flex-col">
          {/* STEP 1: Base Type (Skip for Rice) */}
          {!isRice && (
            <div className="option-group">
              <span className="option-label">Base</span>
              <div className="option-row">
                {['idiyappam', 'rotti'].map((base) => (
                  <button
                    key={base}
                    onClick={() => handleBaseChange(base)}
                    className={`option-btn font-heading font-semibold transition-all
                      ${baseType === base
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                  >
                    {t[base as keyof typeof t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Proteins/Extras */}
          <div className="option-group">
            <div className="flex items-center justify-between">
              <span className="option-label mb-0 leading-tight">Protein</span>
              {sizeMode === 'manual' && (
                <span className="text-[#888] text-[10px] uppercase font-semibold">Multi-select enabled</span>
              )}
            </div>
            <div className="option-row mt-1" style={{ flexWrap: 'wrap' }}>
              {['chicken', 'beef', 'egg', 'extra'].map((p) => {
                const isSelected = proteins.includes(p);
                const isDisabled = p === 'extra' && sizeMode !== 'manual';
                
                return (
                  <button
                    key={p}
                    onClick={() => !isDisabled && toggleProtein(p)}
                    className={`option-btn font-heading font-semibold transition-all
                      ${isDisabled
                        ? 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#BCBCBC] cursor-not-allowed opacity-50 pointer-events-none'
                        : isSelected
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                    style={{ flexBasis: 'calc(50% - 3px)', flexGrow: 1 }}
                  >
                    {t[p as keyof typeof t]}
                  </button>
                );
              })}
            </div>
          </div>

           {/* STEP 3: Size Mode */}
          <div className="option-group">
            <span className="option-label">Size</span>
            <div className="option-row">
              {['normal', 'full', 'manual'].map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size as any)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${sizeMode === size
                      ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                      : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                    }
                  `}
                >
                  {size === 'normal' 
                    ? `${t.normal} (${t.lkr} ${normalPrice})` 
                    : size === 'full' 
                    ? `${t.full} (${t.lkr} ${fullPrice})` 
                    : t.manual}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Numpad Area (Bottom) */}
      <div className="shrink-0 flex flex-col gap-[6px]">
        <Numpad value={price} onChange={setPrice} mode="price" language={language} />
        
        {/* STEP 4: Actions */}
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
