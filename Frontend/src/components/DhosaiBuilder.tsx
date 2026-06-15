import { useState } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { MenuCategory } from '../catalog';

interface DhosaiBuilderProps {
  key?: string | number;
  categoryConfig: MenuCategory;
  language: Language;
  prices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  initialItem?: BillItem;
}

export function DhosaiBuilder({ categoryConfig, language, prices, onAdd, onComplete, initialItem }: DhosaiBuilderProps) {
  const t = translations[language];

  const bases = categoryConfig.bases || [];
  const defaultBase = bases[0]?.id || 'beef';

  const getBasePrice = (id: string) => {
    const baseOpt = bases.find(b => b.id === id);
    if (baseOpt?.price !== undefined) return baseOpt.price;
    const key = id === 'beef' ? 'dhosaBeef' : 'dhosaExtra';
    return prices[key] ?? (id === 'beef' ? 200 : 250);
  };

  const [baseType, setBaseType] = useState<string>(() => initialItem?.baseType || defaultBase);
  const [subType, setSubType] = useState<string>(() => initialItem?.subType || 'beef');
  const [price, setPrice] = useState<string>(() => initialItem ? String(initialItem.price) : String(getBasePrice(defaultBase)));

  const resetState = () => {
    setBaseType(defaultBase);
    setSubType('beef');
    setPrice(String(getBasePrice(defaultBase)));
  };

  const handleBaseTypeChange = (type: string) => {
    setBaseType(type);
    setPrice(String(getBasePrice(type)));
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
          {bases.length > 0 && (
            <div className="option-group">
              <span className="option-label">Base</span>
              <div className="option-row">
                {bases.map((typeOption) => (
                  <button
                    key={typeOption.id}
                    onClick={() => handleBaseTypeChange(typeOption.id)}
                    className={`option-btn base-option-btn font-heading font-semibold transition-all
                      ${baseType === typeOption.id
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                  >
                    {language === 'ta' ? typeOption.nameTa : typeOption.nameEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EXTRA Sub-type */}
          {baseType === 'extra' && categoryConfig.proteins && categoryConfig.proteins.length > 0 && (
            <div className="option-group">
              <span className="option-label">Protein</span>
              <div className="option-row">
                {categoryConfig.proteins.map((subOption) => (
                  <button
                    key={subOption.id}
                    onClick={() => setSubType(subOption.id)}
                    className={`option-btn font-heading font-semibold transition-all
                      ${subType === subOption.id
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                  >
                    {language === 'ta' ? subOption.nameTa : subOption.nameEn}
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
