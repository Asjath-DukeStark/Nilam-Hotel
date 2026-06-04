import { X, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Language, translations } from '../translations';
import { BillItem } from '../types';

interface OrderPanelProps {
  language: Language;
  items: BillItem[];
  mode: 'DINE_IN' | 'TAKEAWAY' | null;
  orderType: 'takeaway' | 'dineIn' | 'both';
  setOrderType: (type: 'takeaway' | 'dineIn' | 'both') => void;
  tableNumber: string;
  setTableNumber: (no: string) => void;
  onRemoveItem: (id: string) => void;
  onClearBill: () => void;
  onCompleteBill: () => void;
  extraPrices?: Record<string, number>;
}

export function OrderPanel({ 
  language, 
  items, 
  mode,
  orderType,
  setOrderType,
  tableNumber,
  setTableNumber,
  onRemoveItem, 
  onClearBill,
  onCompleteBill,
  extraPrices
}: OrderPanelProps) {
  const t = translations[language];

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handleClearText = () => {
    if (window.confirm(t.clearBillConfirm)) {
      onClearBill();
    }
  };

  return (
    <div className="right-panel bg-white border-l border-gray-200 flex flex-col h-full shadow-2xl relative z-10 shrink-0 min-w-[320px]">
      {/* Order List Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        
        {/* Dine-In Extras */}
        {mode === 'DINE_IN' && (
          <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 shrink-0">
            <div className="flex gap-2">
              {['takeaway', 'dineIn', 'both'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type as any)}
                  className={`flex-1 py-3 rounded-xl font-heading font-semibold text-sm transition-all active:scale-95 ${
                    orderType === type
                      ? 'bg-brand-charcoal text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {t[type as keyof typeof t]}
                </button>
              ))}
            </div>
            
            <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden items-center focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
              <span className="pl-4 pr-2 text-gray-500 font-heading font-medium text-sm">{t.tableNo}</span>
              <input 
                type="text" 
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="flex-1 py-3 px-2 bg-transparent outline-none font-heading font-bold text-brand-charcoal w-full text-[16px]"
                placeholder="---"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="font-heading font-bold text-xl text-brand-charcoal">
            {t.total} - {items.length === 0 ? t.noItemsYet.toLowerCase() : items.length}
          </h2>
          {items.length > 0 && (
            <button 
              onClick={handleClearText}
              className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center justify-center"
              title={t.clearBill}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex-1 scrollable no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-6">
              <div className="w-24 h-24 mb-4 opacity-20 bg-gray-400 rounded-full flex items-center justify-center">
                 <span className="text-4xl text-white">🍽️</span>
              </div>
              <span className="text-gray-400 font-medium text-lg text-center">{t.noItemsYet}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const categoryLabel = t[item.categoryId as keyof typeof t] || item.categoryId;
                  const baseTypeLabel = item.baseType ? t[item.baseType as keyof typeof t] : null;
                  const subTypeLabel = item.subType ? t[item.subType as keyof typeof t] : null;
                  
                  const isKottuFlow = ['kottu', 'dolphinKottu', 'rice'].includes(item.categoryId);
                  
                  let proteinsLabel = null;
                  let sizeLabel = null;
                  
                  if (isKottuFlow) {
                    const sizeMode = item.sizeMode || '';
                    const hasExtra = sizeMode.includes('extra');
                    
                    if (hasExtra) {
                      const breakdown = (item.proteins || []).map((p: any) => {
                        const pName = typeof p === 'string' ? p : p.name;
                        const pQty = typeof p === 'string' ? 1 : p.qty;
                        const translatedName = t[pName.toLowerCase() as keyof typeof t] || pName;
                        
                        const priceKey = `extra${pName.charAt(0).toUpperCase()}${pName.slice(1).toLowerCase()}`;
                        const unitPrice = (extraPrices && extraPrices[priceKey]) ?? (priceKey === 'extraChicken' ? 100 : priceKey === 'extraBeef' ? 120 : priceKey === 'extraEgg' ? 50 : 0);
                        
                        return `${translatedName}×${pQty} @ LKR${unitPrice}`;
                      }).join(' + ');
                      
                      const extraSuffix = breakdown ? `(${breakdown})` : '';
                      const extraWord = t.extra || 'Extra';
                      if (sizeMode === 'normal_extra') {
                        sizeLabel = `${t.normal} + ${extraWord}${extraSuffix}`;
                      } else if (sizeMode === 'full_extra') {
                        sizeLabel = `${t.full} + ${extraWord}${extraSuffix}`;
                      } else {
                        sizeLabel = `${extraWord}${extraSuffix}`;
                      }
                    } else {
                      if (item.proteins && item.proteins.length > 0) {
                        proteinsLabel = item.proteins.map((p: any) => {
                          const pName = typeof p === 'string' ? p : p.name;
                          return t[pName.toLowerCase() as keyof typeof t] || pName;
                        }).join(' + ');
                      }
                      
                      if (sizeMode === 'normal') {
                        sizeLabel = t.normal;
                      } else if (sizeMode === 'full') {
                        sizeLabel = t.full;
                      }
                    }
                  } else {
                    // Non-kottu flow: standard formatting
                    proteinsLabel = item.proteins && item.proteins.length > 0 
                      ? item.proteins.map((p: any) => {
                          const pName = typeof p === 'string' ? p : p.name;
                          return t[pName.toLowerCase() as keyof typeof t] || pName;
                        }).join(' + ') 
                      : null;
                    sizeLabel = item.sizeMode ? t[item.sizeMode as keyof typeof t] || item.sizeMode : null;
                  }
                  
                  const parts = [
                    categoryLabel,
                    baseTypeLabel,
                    subTypeLabel,
                    proteinsLabel,
                    sizeLabel
                  ].filter(Boolean);
                  
                  let titleStr = parts.join(' · ');
                  if (item.qty) {
                    titleStr += ` \u00d7 ${item.qty}`;
                  }

                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-4 items-center group shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-heading font-medium text-[15px] text-brand-charcoal leading-tight">
                          {titleStr}
                        </p>
                        <p className="text-brand-primary font-semibold mt-1">
                          {t.lkr} {item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Bill Summary Area */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center text-gray-500 px-2 font-medium">
          <span>{t.subtotal}</span>
          <span>{t.lkr} {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-brand-charcoal px-2 mb-2">
          <span className="font-heading text-xl font-bold">{t.total}</span>
          <span className="font-heading text-4xl font-bold tracking-tight">{t.lkr} {total.toFixed(2)}</span>
        </div>
        <button 
          disabled={items.length === 0}
          onClick={onCompleteBill}
          className={`w-full action-btn rounded-2xl font-heading font-bold text-xl uppercase transition-all ${
            items.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand-primary text-white hover:bg-amber-700 active:scale-95 shadow-lg shadow-amber-600/20'
          }`}
        >
          {t.completeBill}
        </button>
      </div>
    </div>
  );
}
