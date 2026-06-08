import { useState } from 'react';
import { Numpad } from './Numpad';
import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { ImageButton } from './ImageButton';
import { StockBadge } from './StockBadge';

interface FixedItem {
  id: string;
  price: number;
  nameEn?: string;
  nameTa?: string;
}

interface FixedItemBuilderProps {
  key?: string | number;
  categoryId: string;
  items: FixedItem[];
  customPrices?: Record<string, number>;
  language: Language;
  onAdd: (item: BillItem) => void;
  onComplete: (item: BillItem) => void;
  stock?: any; // Pumping the stock object from useStock
  initialItem?: BillItem;
}

export function FixedItemBuilder({ categoryId, items, customPrices = {}, language, onAdd, onComplete, stock, initialItem }: FixedItemBuilderProps) {
  const t = translations[language];

  const getPrice = (item: FixedItem) => customPrices[item.id] !== undefined ? customPrices[item.id] : item.price;

  const [selectedItemId, setSelectedItemId] = useState<string>(() => initialItem?.baseType || items[0]?.id || '');
  const [qtyStr, setQtyStr] = useState<string>(() => {
    if (initialItem) {
      const selectedInfo = items.find(i => i.id === initialItem.baseType);
      const isFixed = selectedInfo && getPrice(selectedInfo) > 0;
      if (isFixed) {
        return initialItem.qty ? String(initialItem.qty) : '0';
      } else {
        return String(initialItem.price);
      }
    }
    return '0';
  });
  
  // Stock warning
  const [stockWarning, setStockWarning] = useState<string>('');

  const selectedItemInfo = items.find(i => i.id === selectedItemId);
  
  const unitPrice = selectedItemInfo ? getPrice(selectedItemInfo) : 0;
  const currentTotal = unitPrice * (parseInt(qtyStr) || 0);

  const isShorties = categoryId === 'shorties' && stock;

  const resetState = () => {
    const firstItem = items[0];
    setSelectedItemId(firstItem?.id || '');
    setQtyStr('0');
    setStockWarning('');
  };

  const createItem = (): BillItem => {
    const p = selectedItemInfo ? getPrice(selectedItemInfo) : 0;
    const numVal = parseInt(qtyStr) || (p > 0 ? 1 : 0);
    return {
      id: crypto.randomUUID(),
      categoryId: categoryId,
      baseType: selectedItemId,
      proteins: [],
      qty: p > 0 ? numVal : undefined,
      price: p > 0 ? p * numVal : numVal,
    };
  };

  const validateStock = (numVal: number) => {
    if (!isShorties || !selectedItemId) return true;
    const friedQty = stock.stockData[selectedItemId]?.friedQty || 0;
    if (numVal > friedQty) {
      setStockWarning(t.onlyAvailable + ' ' + friedQty + ' ' + t.pcsAvailable);
      return false;
    }
    return true;
  };

  const performStockDeduction = (numVal: number) => {
    if (isShorties && selectedItemId) {
      stock.deductSold(selectedItemId, numVal);
    }
  };

  const handleAddClick = () => {
    setStockWarning('');
    const item = createItem();
    if (item.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    
    // Qty is used for numVal deduction for shorties
    const numVal = item.qty || 1;
    if (!validateStock(numVal)) return;

    performStockDeduction(numVal);
    onAdd(item);
    resetState();
  };

  const handleCompleteClick = () => {
    setStockWarning('');
    const item = createItem();
    if (item.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    
    const numVal = item.qty || 1;
    if (!validateStock(numVal)) return;

    performStockDeduction(numVal);
    onComplete(item);
    resetState();
  };

  // Helper for item selection to clear warnings and qty
  const handleItemSelect = (id: string, p: number) => {
    setStockWarning('');
    const out = stock?.stockData[id]?.friedQty === 0;
    if (isShorties && out) return;
    
    setSelectedItemId(id);
    setQtyStr('0');
  };

  return (
    <>
      <div className="option-area mb-2 no-scrollbar">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
          {items.map((item) => {
            const price = getPrice(item);
            const friedQty = stock?.stockData[item.id]?.friedQty ?? -1;
            const isOutOfStock = isShorties && friedQty === 0;
            const isSelected = selectedItemId === item.id;
            
            return (
              <div key={item.id} className="relative w-full h-[76px]">
                {isShorties && friedQty >= 0 && (
                  <StockBadge qty={friedQty} />
                )}
                <ImageButton
                  itemId={item.id}
                  label={(language === 'ta' && item.nameTa) ? item.nameTa : (item.nameEn || t[item.id as keyof typeof t])}
                  subLabel={price > 0 ? `${t.lkr} ${price}` : undefined}
                  isSelected={isSelected}
                  onClick={() => handleItemSelect(item.id, price)}
                  className={`w-full h-full rounded-xl shadow-sm ${
                    isOutOfStock
                      ? "bg-gray-100 opacity-40 pointer-events-none grayscale"
                      : isShorties && friedQty > 0 && friedQty <= 5
                      ? "bg-white shadow-[0_0_12px_rgba(217,119,6,0.3)] ring-2 ring-amber-400"
                      : "bg-white"
                  }`}
                  labelClassName="text-[11px] leading-tight"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Numpad Area */}
      <div className="shrink-0 flex flex-col gap-[6px]">
        <div className="flex flex-col gap-1">
          <Numpad value={qtyStr} onChange={(val) => { setQtyStr(val); setStockWarning(''); }} mode={unitPrice > 0 ? "qty" : "price"} language={language} />
          
          {stockWarning && (
            <div className="text-red-500 text-center font-bold text-[11px] bg-red-50 py-1 rounded-lg border border-red-200 mt-1">
              {stockWarning}
            </div>
          )}

          <div className="w-full bg-gray-50 border border-gray-200 text-center shadow-inner rounded-[8px] flex items-center justify-center h-[34px]">
            <span className="font-heading font-semibold text-brand-charcoal text-[13px]">
              {selectedItemInfo ? ((language === 'ta' && selectedItemInfo.nameTa) ? selectedItemInfo.nameTa : (selectedItemInfo.nameEn || t[selectedItemInfo.id as keyof typeof t])) : ''} {unitPrice > 0 ? `× ${parseInt(qtyStr) || 0}` : ''} = {t.lkr} {currentTotal || (unitPrice === 0 ? parseInt(qtyStr) || 0 : 0)}
            </span>
          </div>
        </div>
        
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
