import { useState, useEffect } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { DEFAULT_PRICES } from '../constants';

interface MealsBuilderProps {
  key?: string | number;
  language: Language;
  prices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  initialItem?: BillItem;
}

export function MealsBuilder({ language, prices, onAdd, onComplete, initialItem }: MealsBuilderProps) {
  const t = translations[language];

  const [baseType, setBaseType] = useState<string>(() => initialItem?.baseType || 'idiyappam');
  const [subType, setSubType] = useState<string>(() => initialItem?.subType || 'plain');
  const [curry, setCurry] = useState<string>(() => {
    if (initialItem?.proteins && initialItem.proteins.length > 0) {
      const p = initialItem.proteins[0];
      return typeof p === 'string' ? p : p.name;
    }
    return 'nocurry';
  });

  const [price, setPrice] = useState<string>(() => initialItem ? String(initialItem.price) : '0');

  useEffect(() => {
    const baseKey = baseType === 'idiyappam' ? 'mealsIdiyappam' : 'mealsParata';
    const styleKey = subType === 'plain' ? 'mealsPlain' : 'mealsSambal';
    const curryPriceKey = curry;

    const baseVal = prices[baseKey] ?? DEFAULT_PRICES[baseKey as keyof typeof DEFAULT_PRICES] ?? 150;
    const styleVal = prices[styleKey] ?? DEFAULT_PRICES[styleKey as keyof typeof DEFAULT_PRICES] ?? 0;
    const curryVal = prices[curryPriceKey] ?? DEFAULT_PRICES[curryPriceKey as keyof typeof DEFAULT_PRICES] ?? 0;

    const computed = baseVal + styleVal + curryVal;
    
    if (initialItem && baseType === initialItem.baseType && subType === initialItem.subType) {
      const initialCurry = initialItem.proteins && initialItem.proteins.length > 0
        ? (typeof initialItem.proteins[0] === 'string' ? initialItem.proteins[0] : initialItem.proteins[0].name)
        : 'nocurry';
      if (curry === initialCurry) {
        return;
      }
    }
    setPrice(String(computed));
  }, [baseType, subType, curry, prices]);

  const resetState = () => {
    setBaseType('idiyappam');
    setSubType('plain');
    setCurry('nocurry');
  };

  const createItem = (): BillItem => {
    return {
      id: initialItem?.id || crypto.randomUUID(),
      categoryId: 'meals',
      baseType,
      subType,
      proteins: curry !== 'nocurry' ? [curry] : [],
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
          {/* Base Type */}
          <div className="option-group">
            <span className="option-label">{t.meals}</span>
            <div className="option-row">
              {[
                { id: 'idiyappam', label: t.idiyappam },
                { id: 'parata', label: t.parata },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBaseType(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${baseType === opt.id
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

          {/* Style */}
          <div className="option-group">
            <span className="option-label">Style</span>
            <div className="option-row">
              {[
                { id: 'plain', label: t.plain },
                { id: 'sambal', label: t.sambal },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSubType(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${subType === opt.id
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

          {/* Curry */}
          <div className="option-group">
            <span className="option-label">{t.curry}</span>
            <div className="option-row flex-wrap gap-2">
              {[
                { id: 'nocurry', label: t.nocurry },
                { id: 'dhalcurry', label: t.dhalcurry },
                { id: 'eggcurry', label: t.eggcurry },
                { id: 'fishcurry', label: t.fishcurry },
                { id: 'chickencurry', label: t.chickencurry },
                { id: 'beefcurry', label: t.beefcurry },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCurry(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${curry === opt.id
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
