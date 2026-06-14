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

  const [baseType, setBaseType] = useState<string>(() => initialItem?.baseType || '');
  const [subType, setSubType] = useState<string>(() => initialItem?.subType || 'plain');
  const [curry, setCurry] = useState<string>(() => {
    if (initialItem?.proteins && initialItem.proteins.length > 0) {
      const p = initialItem.proteins[0];
      return typeof p === 'string' ? p : p.name;
    }
    return 'nocurry';
  });
  const [qty, setQty] = useState<number>(() => initialItem?.qty || 0);
  const [showQtyPopup, setShowQtyPopup] = useState<boolean>(false);
  const [popupQty, setPopupQty] = useState<string>('0');

  const [price, setPrice] = useState<string>(() => initialItem ? String(initialItem.price) : '0');
  const [lastAction, setLastAction] = useState<'price' | 'qty'>('qty');

  const isOptionsDisabled = !baseType;

  useEffect(() => {
    if (!baseType) {
      if (lastAction === 'qty') {
        setPrice('0');
      }
      return;
    }
    let baseKey = '';
    if (baseType === 'idiyappam') {
      baseKey = subType === 'plain' ? 'mealsIdiyappamPlain' : 'mealsIdiyappamSambal';
    } else {
      baseKey = subType === 'plain' ? 'mealsParataPlain' : 'mealsParataSambal';
    }

    const baseVal = prices[baseKey] ?? DEFAULT_PRICES[baseKey as keyof typeof DEFAULT_PRICES] ?? (baseKey.startsWith('mealsIdiyappam') ? 10 : 30);
    const curryPriceKey = curry;
    const curryVal = prices[curryPriceKey] ?? DEFAULT_PRICES[curryPriceKey as keyof typeof DEFAULT_PRICES] ?? 0;

    if (lastAction === 'price') {
      const numericPrice = Number(price);
      const calculatedQty = baseVal > 0 ? Math.max(0, Math.round((numericPrice - curryVal) / baseVal)) : 0;
      if (calculatedQty !== qty) {
        setQty(calculatedQty);
      }
      // Keep user-entered price exactly as typed without overwriting it with the rounded baseVal * qty value
    } else {
      const computed = Math.ceil((baseVal * qty) + curryVal);
      if (initialItem && baseType === initialItem.baseType && subType === initialItem.subType) {
        const initialCurry = initialItem.proteins && initialItem.proteins.length > 0
          ? (typeof initialItem.proteins[0] === 'string' ? initialItem.proteins[0] : initialItem.proteins[0].name)
          : 'nocurry';
        if (curry === initialCurry && qty === (initialItem.qty || 1)) {
          return;
        }
      }
      if (String(computed) !== price) {
        setPrice(String(computed));
      }
    }
  }, [baseType, subType, curry, prices, qty, price, lastAction]);

  const resetState = () => {
    setBaseType('');
    setSubType('plain');
    setCurry('nocurry');
    setQty(0);
    setLastAction('qty');
  };

  const createItem = (): BillItem => {
    return {
      id: initialItem?.id || crypto.randomUUID(),
      categoryId: 'meals',
      baseType: baseType || undefined,
      subType,
      proteins: curry !== 'nocurry' ? [curry] : [],
      qty,
      price: Number(price) || 0,
    };
  };

  const handleAddClick = () => {
    if (!baseType) {
      alert(language === 'ta' ? 'தயவுசெய்து இடியாப்பம் அல்லது பராட்டாவைத் தேர்ந்தெடுக்கவும்' : 'Please select a base type (Idiyappam or Parata)');
      return;
    }
    if (Number(price) <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    onAdd(createItem());
    resetState();
  };

  const handleCompleteClick = () => {
    if (!baseType) {
      alert(language === 'ta' ? 'தயவுசெய்து இடியாப்பம் அல்லது பராட்டாவைத் தேர்ந்தெடுக்கவும்' : 'Please select a base type (Idiyappam or Parata)');
      return;
    }
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
                  onClick={() => {
                    if (baseType === opt.id) {
                      setPopupQty(String(qty));
                      setShowQtyPopup(true);
                    } else {
                      setBaseType(opt.id);
                      if (Number(price) === 0) {
                        setPopupQty('0');
                        setShowQtyPopup(true);
                      }
                    }
                  }}
                  className={`option-btn base-option-btn font-heading font-semibold transition-all
                    ${baseType === opt.id
                      ? 'bg-amber-600 border-[1.5px] border-amber-600 text-white shadow-[0_2px_8px_rgba(217,119,6,0.35)] scale-[1.03]'
                      : 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#1C1C1E] active:scale-95'
                    }
                  `}
                >
                  {opt.label} {baseType === opt.id ? `(×${qty})` : ''}
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
                  onClick={() => !isOptionsDisabled && setSubType(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${isOptionsDisabled
                      ? 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#BCBCBC] cursor-not-allowed opacity-50 pointer-events-none'
                      : subType === opt.id
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
                  onClick={() => !isOptionsDisabled && setCurry(opt.id)}
                  className={`option-btn font-heading font-semibold transition-all
                    ${isOptionsDisabled
                      ? 'bg-[#F5F5F5] border-[1.5px] border-[#E0E0E0] text-[#BCBCBC] cursor-not-allowed opacity-50 pointer-events-none'
                      : curry === opt.id
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
        <Numpad
          value={price}
          onChange={(val) => {
            setPrice(val);
            setLastAction('price');
          }}
          mode="price"
          language={language}
        />
        
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
      {showQtyPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-heading font-bold text-brand-charcoal text-center">
              {language === 'ta' 
                ? `${baseType === 'idiyappam' ? t.idiyappam : (t.parata || 'பராட்டா')} ${t.enterQty || 'அளவை உள்ளிடவும்'}`
                : `${t.enterQty || 'Enter Quantity'} for ${baseType === 'idiyappam' ? t.idiyappam : (t.parata || 'Parata')}`}
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
                onClick={() => setShowQtyPopup(false)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 font-heading font-bold uppercase transition-all outline-none"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(popupQty);
                  if (isNaN(val) || val <= 0) {
                    alert(language === 'ta' ? 'அளவு 1 ஐ விட அதிகமாக இருக்க வேண்டும்' : 'Quantity must be greater than 0');
                    return;
                  }
                  setQty(val);
                  setLastAction('qty');
                  setShowQtyPopup(false);
                }}
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
