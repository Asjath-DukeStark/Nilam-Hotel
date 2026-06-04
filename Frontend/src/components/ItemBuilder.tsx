import { useState, useEffect } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';

interface ItemBuilderProps {
  key?: string | number;
  category: string;
  language: Language;
  prices: Record<string, number>;
  extraPrices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  initialItem?: BillItem;
}

export function ItemBuilder({ category, language, prices, extraPrices, onAdd, onComplete, initialItem }: ItemBuilderProps) {
  const t = translations[language];
  const isRice = category === 'rice';

  const normalPriceKey = category === 'kottu' ? 'kottuNormal' : category === 'dolphinKottu' ? 'dolphinNormal' : 'riceNormal';
  const fullPriceKey = category === 'kottu' ? 'kottuFull' : category === 'dolphinKottu' ? 'dolphinFull' : 'riceFull';

  const normalPrice = prices[normalPriceKey] ?? 350;
  const fullPrice = prices[fullPriceKey] ?? 500;

  const [baseType, setBaseType] = useState<string>(initialItem?.baseType || '');
  const [proteins, setProteins] = useState<{ name: string; qty: number }[]>(() => {
    if (initialItem && initialItem.proteins) {
      return initialItem.proteins.map(p => typeof p === 'string' ? { name: p, qty: 1 } : p);
    }
    return [];
  });
  const [isNormal, setIsNormal] = useState<boolean>(() => {
    const mode = initialItem?.sizeMode || '';
    return mode === 'normal' || mode === 'normal_extra';
  });
  const [isFull, setIsFull] = useState<boolean>(() => {
    const mode = initialItem?.sizeMode || '';
    return mode === 'full' || mode === 'full_extra';
  });
  const [isExtra, setIsExtra] = useState<boolean>(() => {
    const mode = initialItem?.sizeMode || '';
    return mode === 'extra' || mode === 'normal_extra' || mode === 'full_extra';
  });
  const [price, setPrice] = useState<string>(initialItem ? String(initialItem.price) : '');

  // Popup states
  const [activeProteinPopup, setActiveProteinPopup] = useState<string | null>(null);
  const [popupQty, setPopupQty] = useState<string>('1');

  const handleBaseChange = (type: string) => setBaseType(type);

  const toggleProtein = (pName: string) => {
    if (isExtra) {
      // Quantity popup mode
      const existing = proteins.find(p => p.name === pName);
      const initialQty = existing ? existing.qty : 1;
      setPopupQty(String(initialQty));
      setActiveProteinPopup(pName);
    } else {
      // Single select, qty 1, no popup
      if (pName === 'extra') return; // Extra protein button is disabled when size Extra toggle is OFF
      
      setProteins(prev => {
        const alreadySelected = prev.some(p => p.name === pName);
        if (alreadySelected) {
          return [];
        } else {
          return [{ name: pName, qty: 1 }];
        }
      });
    }
  };

  const handlePopupConfirm = (qtyVal: number) => {
    if (activeProteinPopup) {
      const pName = activeProteinPopup;
      setProteins(prev => {
        if (qtyVal <= 0) {
          return prev.filter(p => p.name !== pName);
        }
        const existing = prev.some(p => p.name === pName);
        if (existing) {
          return prev.map(p => p.name === pName ? { ...p, qty: qtyVal } : p);
        } else {
          return [...prev, { name: pName, qty: qtyVal }];
        }
      });
    }
    setActiveProteinPopup(null);
  };

  const handleNormalToggle = () => {
    setIsNormal(prev => {
      const newVal = !prev;
      if (newVal) {
        setIsFull(false);
      }
      return newVal;
    });
  };

  const handleFullToggle = () => {
    setIsFull(prev => {
      const newVal = !prev;
      if (newVal) {
        setIsNormal(false);
      }
      return newVal;
    });
  };

  const handleExtraToggle = () => {
    setIsExtra(prev => {
      const newVal = !prev;
      if (!newVal) {
        // When Extra is turned OFF, clear extra proteins or keep at most one with qty 1 (excluding 'extra' itself)
        setProteins(curr => {
          if (curr.length > 0) {
            const firstProtein = curr.find(p => p.name !== 'extra');
            if (firstProtein) {
              return [{ name: firstProtein.name, qty: 1 }];
            }
          }
          return [];
        });
      }
      return newVal;
    });
  };

  // Price auto-calculation
  useEffect(() => {
    let base = 0;
    if (isNormal) base = normalPrice;
    else if (isFull) base = fullPrice;

    let extraTotal = 0;
    if (isExtra) {
      proteins.forEach(p => {
        const priceKey = `extra${p.name.charAt(0).toUpperCase()}${p.name.slice(1).toLowerCase()}`;
        const pPrice = extraPrices[priceKey] ?? 0;
        extraTotal += p.qty * pPrice;
      });
    }

    setPrice(String(base + extraTotal));
  }, [isNormal, isFull, isExtra, proteins, prices, extraPrices, normalPrice, fullPrice]);

  const resetState = () => {
    setBaseType('');
    setProteins([]);
    setIsNormal(false);
    setIsFull(false);
    setIsExtra(false);
    setPrice('');
  };

  const sizeModeVal = () => {
    if (isNormal && isExtra) return 'normal_extra';
    if (isFull && isExtra) return 'full_extra';
    if (isNormal) return 'normal';
    if (isFull) return 'full';
    if (isExtra) return 'extra';
    return '';
  };

  const createItem = (): BillItem => {
    return {
      id: crypto.randomUUID(),
      categoryId: category,
      baseType: isRice ? undefined : baseType,
      proteins,
      sizeMode: sizeModeVal(),
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
              {isExtra && (
                <span className="text-[#888] text-[10px] uppercase font-semibold">Multi-select enabled</span>
              )}
            </div>
            <div className="option-row mt-1" style={{ flexWrap: 'wrap' }}>
              {['chicken', 'beef', 'egg', 'extra'].map((p) => {
                const selectedItem = proteins.find((x) => x.name === p);
                const isSelected = !!selectedItem;
                const isDisabled = p === 'extra' && !isExtra;
                
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
                    {selectedItem && isExtra ? ` ×${selectedItem.qty}` : ''}
                  </button>
                );
              })}
            </div>
          </div>

           {/* STEP 3: Size Mode */}
          <div className="option-group">
            <span className="option-label">Size</span>
            <div className="option-row">
              {/* Normal Size Toggle */}
              <button
                type="button"
                onClick={handleNormalToggle}
                className={`option-btn font-heading font-semibold transition-all
                  ${isNormal
                    ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                    : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                  }
                `}
              >
                {t.normal} ({t.lkr} {normalPrice})
              </button>

              {/* Full Size Toggle */}
              <button
                type="button"
                onClick={handleFullToggle}
                className={`option-btn font-heading font-semibold transition-all
                  ${isFull
                    ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                    : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                  }
                `}
              >
                {t.full} ({t.lkr} {fullPrice})
              </button>

              {/* Extra Toggle */}
              <button
                type="button"
                onClick={handleExtraToggle}
                className={`option-btn font-heading font-semibold transition-all
                  ${isExtra
                    ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                    : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                  }
                `}
              >
                {t.extra || 'Extra'}
              </button>
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

      {/* Quantity Numpad Popup Modal */}
      {activeProteinPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-heading font-bold text-brand-charcoal text-center">
              {language === 'ta' 
                ? `எத்தனை ${t[activeProteinPopup as keyof typeof t] || activeProteinPopup}?` 
                : `How many ${t[activeProteinPopup as keyof typeof t] || activeProteinPopup}?`}
            </h3>
            
            {/* Current quantity display */}
            <div className="text-5xl font-heading font-black text-brand-primary my-2 bg-amber-50 px-6 py-2 rounded-2xl border border-amber-100 min-w-[100px] text-center">
              {popupQty}
            </div>
            
            {/* Large numpad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setPopupQty(prev => {
                      if (prev === '0') return String(num);
                      return prev + num;
                    });
                  }}
                  className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-lg font-heading font-bold text-brand-charcoal flex items-center justify-center outline-none"
                >
                  {num}
                </button>
              ))}
              {/* Row 4: Empty space, 0, Backspace */}
              <div className="flex items-center justify-center"></div>
              <button
                type="button"
                onClick={() => {
                  setPopupQty(prev => {
                    if (prev === '0') return '0';
                    return prev + '0';
                  });
                }}
                className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-lg font-heading font-bold text-brand-charcoal flex items-center justify-center outline-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setPopupQty(prev => {
                    if (prev.length <= 1) return '0';
                    return prev.slice(0, -1);
                  });
                }}
                className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-lg font-heading font-bold text-brand-charcoal flex items-center justify-center outline-none"
              >
                ⌫
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setActiveProteinPopup(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 font-heading font-bold uppercase transition-all outline-none"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handlePopupConfirm(Number(popupQty))}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-heading font-bold uppercase transition-all shadow-md shadow-amber-600/10 outline-none"
              >
                {language === 'ta' ? 'உறுதிசெய்' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
