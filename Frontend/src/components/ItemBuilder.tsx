import { useState, useEffect } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { MenuCategory } from '../catalog';

interface ItemBuilderProps {
  key?: string | number;
  category: string;
  categoryConfig: MenuCategory;
  language: Language;
  prices: Record<string, number>;
  extraPrices: Record<string, number>;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  initialItem?: BillItem;
}

export function ItemBuilder({ category, categoryConfig, language, prices, extraPrices, onAdd, onComplete, initialItem }: ItemBuilderProps) {
  const t = translations[language];
  const isRice = category === 'rice';

  const normalPriceKey = category === 'kottu' ? 'kottuNormal' : category === 'dolphinKottu' ? 'dolphinNormal' : 'riceNormal';
  const fullPriceKey = category === 'kottu' ? 'kottuFull' : category === 'dolphinKottu' ? 'dolphinFull' : 'riceFull';

  const normalSize = categoryConfig.sizes?.find(s => s.id === 'normal');
  const fullSize = categoryConfig.sizes?.find(s => s.id === 'full');
  const normalPrice = normalSize?.price ?? prices[normalPriceKey] ?? 350;
  const fullPrice = fullSize?.price ?? prices[fullPriceKey] ?? 500;

  const [baseType, setBaseType] = useState<string>(() => {
    if (initialItem?.baseType) return initialItem.baseType;
    if (category === 'dolphinKottu') return 'rotti';
    return '';
  });
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
  const [price, setPrice] = useState<string>(initialItem ? String(initialItem.price) : '0');
  const [mainProtein, setMainProtein] = useState<string | null>(() => {
    if (initialItem && initialItem.proteins && initialItem.proteins.length > 0) {
      const first = initialItem.proteins.find(p => typeof p === 'string' ? p !== 'extra' : p.name !== 'extra');
      if (first) {
        return typeof first === 'string' ? first : first.name;
      }
    }
    return null;
  });

  // Popup states
  const [activeProteinPopup, setActiveProteinPopup] = useState<string | null>(null);
  const [popupQty, setPopupQty] = useState<string>('0');

  const handleBaseChange = (type: string) => setBaseType(type);

  const toggleProtein = (pName: string) => {
    if (isExtra) {
      // Quantity popup mode
      const existing = proteins.find(p => p.name === pName);
      const isMain = pName === mainProtein;
      const currentQty = existing ? existing.qty : 0;
      const initialExtraQty = isMain ? Math.max(0, currentQty - (pName === 'egg' ? 3 : 1)) : currentQty;

      setPopupQty(String(initialExtraQty));
      setActiveProteinPopup(pName);
    } else {
      // Single select, qty 1, no popup
      if (pName === 'extra') return; // Extra protein button is disabled when size Extra toggle is OFF
      
      setProteins(prev => {
        const alreadySelected = prev.some(p => p.name === pName);
        if (alreadySelected) {
          setMainProtein(null);
          return [];
        } else {
          setMainProtein(pName);
          return [{ name: pName, qty: pName === 'egg' ? 3 : 1 }];
        }
      });
    }
  };

  const handlePopupConfirm = (extraQtyVal: number) => {
    if (activeProteinPopup) {
      const pName = activeProteinPopup;
      const isMain = pName === mainProtein;
      const newTotalQty = isMain ? extraQtyVal + (pName === 'egg' ? 3 : 1) : extraQtyVal;

      setProteins(prev => {
        if (newTotalQty <= 0 || (!isMain && extraQtyVal <= 0)) {
          return prev.filter(p => p.name !== pName);
        }
        const existing = prev.some(p => p.name === pName);
        if (existing) {
          return prev.map(p => p.name === pName ? { ...p, qty: newTotalQty } : p);
        } else {
          return [...prev, { name: pName, qty: newTotalQty }];
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
              return [{ name: firstProtein.name, qty: firstProtein.name === 'egg' ? 3 : 1 }];
            }
          }
          return [];
        });
      }
      return newVal;
    });
  };

  // Synchronize mainProtein with selected proteins list
  useEffect(() => {
    const validProteins = proteins.filter(p => p.name !== 'extra').map(p => p.name);
    if (validProteins.length > 0) {
      if (!mainProtein || !validProteins.includes(mainProtein)) {
        setMainProtein(validProteins[0]);
      }
    } else {
      setMainProtein(null);
    }
  }, [proteins, mainProtein]);

  // Price auto-calculation
  useEffect(() => {
    let base = 0;
    const hasBaseSize = isNormal || isFull;
    if (isNormal) base = normalPrice;
    else if (isFull) base = fullPrice;

    let extraTotal = 0;
    if (isExtra) {
      proteins.forEach(p => {
        const proteinConfig = categoryConfig.proteins?.find(pr => pr.id === p.name);
        const defaultExtraPrice = proteinConfig?.extraPrice ?? 0;
        const priceKey = `extra${p.name.charAt(0).toUpperCase()}${p.name.slice(1).toLowerCase()}`;
        const pPrice = extraPrices[priceKey] ?? defaultExtraPrice;
        const isStandardProtein = ['chicken', 'beef', 'egg'].includes(p.name.toLowerCase());
        const isMain = p.name === mainProtein;
        const chargedQty = (isStandardProtein && isMain && hasBaseSize) ? Math.max(0, p.qty - (p.name === 'egg' ? 3 : 1)) : p.qty;
        extraTotal += chargedQty * pPrice;
      });
    }

    setPrice(String(base + extraTotal));
  }, [isNormal, isFull, isExtra, proteins, prices, extraPrices, normalPrice, fullPrice, mainProtein]);

  const resetState = () => {
    setBaseType('');
    setProteins([]);
    setIsNormal(false);
    setIsFull(false);
    setIsExtra(false);
    setPrice('0');
    setMainProtein(null);
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
      mainProtein: mainProtein || undefined,
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
          {/* STEP 1: Base Type (Skip if category configuration has no bases) */}
          {categoryConfig.bases && categoryConfig.bases.length > 0 && (
            <div className="option-group">
              <span className="option-label">Base</span>
              <div className="option-row">
                {categoryConfig.bases.map((baseOption) => (
                  <button
                    key={baseOption.id}
                    onClick={() => handleBaseChange(baseOption.id)}
                    className={`option-btn base-option-btn font-heading font-semibold transition-all
                      ${baseType === baseOption.id
                        ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                        : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                      }
                    `}
                  >
                    {language === 'ta' ? baseOption.nameTa : baseOption.nameEn}
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
              {[...(categoryConfig.proteins || []), { id: 'extra', nameEn: 'Extra', nameTa: 'கூடுதல்' }].map((p) => {
                const selectedItem = proteins.find((x) => x.name === p.id);
                const isSelected = !!selectedItem;
                const isDisabled = p.id === 'extra' && !isExtra;
                
                return (
                  <button
                    key={p.id}
                    onClick={() => !isDisabled && toggleProtein(p.id)}
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
                    {language === 'ta' ? p.nameTa : p.nameEn}
                    {selectedItem && isExtra && selectedItem.qty > 1 ? ` ×${selectedItem.qty}` : ''}
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
              {(() => {
                const activeProteinConfig = categoryConfig.proteins?.find(pr => pr.id === activeProteinPopup);
                const activeProteinName = activeProteinConfig ? (language === 'ta' ? activeProteinConfig.nameTa : activeProteinConfig.nameEn) : activeProteinPopup;
                return language === 'ta' 
                  ? `எத்தனை கூடுதல் ${activeProteinName}?` 
                  : `How many Extra ${activeProteinName}?`;
              })()}
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

            {/* Remove Protein Button */}
            <button
              type="button"
              onClick={() => {
                setProteins(prev => prev.filter(p => p.name !== activeProteinPopup));
                setActiveProteinPopup(null);
              }}
              className="w-full max-w-[280px] py-2 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-650 font-heading font-bold uppercase transition-all outline-none border border-red-205 text-[11px] active:scale-95 text-center mt-1"
            >
              {language === 'ta' ? 'அகற்று' : 'Remove Protein'}
            </button>
            
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
