import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, AlertTriangle, Plus, Pencil, Trash2, Image as ImageIcon, Delete } from 'lucide-react';
import { Language, translations } from '../translations';
import { useStock, StockInfo } from '../hooks/useStock';
import { useItemImage } from '../hooks/useItemImage';

interface FixedItem {
  id: string;
  price: number;
  nameEn?: string;
  nameTa?: string;
}

interface StockManagerProps {
  language: Language;
  onBack: () => void;
  stock: ReturnType<typeof useStock>;
  items: FixedItem[];
  setItems: (items: FixedItem[]) => void;
}

export function StockManager({ language, onBack, stock, items, setItems }: StockManagerProps) {
  const t = translations[language];
  const { stockData, updateFrozen, updateFried, transferStock, anyLowStock, anyOutOfStock, logs, clearLogs } = stock;

  const [transferQtys, setTransferQtys] = useState<Record<string, number>>({});
  const [editingItem, setEditingItem] = useState<FixedItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  const [numpadOpen, setNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState('0');
  const [numpadTitle, setNumpadTitle] = useState('');
  const [numpadCallback, setNumpadCallback] = useState<((val: number) => void) | null>(null);

  const openNumpad = (title: string, initialValue: string, callback: (newVal: number) => void) => {
    setNumpadTitle(title);
    setNumpadValue(initialValue);
    setNumpadCallback(() => callback);
    setNumpadOpen(true);
  };

  const handleUpdateTransfer = (itemId: string, delta: number) => {
    setTransferQtys(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleSetTransferQty = (itemId: string, qty: number) => {
    setTransferQtys(prev => ({
      ...prev,
      [itemId]: Math.max(0, qty)
    }));
  };

  const handleTransferSubmit = (itemId: string, qty: number) => {
    if (transferStock(itemId, qty)) {
      setTransferQtys(prev => ({ ...prev, [itemId]: 0 }));
      return true;
    }
    return false;
  };

  const handleDelete = (id: string) => {
    if (items.length <= 1) {
      alert(t.cannotDeleteLast);
      return;
    }
    if (confirm(t.confirmDelete)) {
      setItems(items.filter(i => i.id !== id));
      stock.removeStock(id);
      window.localStorage.removeItem(`img_${id}`);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'UPDATE_FROZEN': return t.logUpdateFrozen;
      case 'UPDATE_FRIED': return t.logUpdateFried;
      case 'TRANSFER': return t.logTransfer;
      case 'SALE': return t.logSale;
      case 'CANCEL_REPLENISH': return t.logCancelReplenish;
      case 'DAMAGE_DEDUCTION': return t.logDamageDeduction;
      case 'FREE_DEDUCTION': return t.logFreeDeduction;
      default: return action;
    }
  };

  const showBanner = anyLowStock || anyOutOfStock;

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Bar: Height 52px, 3px amber top border */}
      <div className="h-[52px] border-t-[3px] border-amber-500 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10 sticky top-0">
        <button 
          onClick={onBack}
          className="flex items-center justify-center min-w-[36px] min-h-[36px] bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-brand-charcoal" />
        </button>
        <span className="font-heading font-bold text-base text-brand-charcoal absolute left-1/2 -translate-x-1/2">
          {t.stockManagement}
        </span>
        <div className="w-[36.5px]"></div> {/* balanced placeholder */}
      </div>

      <div className="flex-1 scrollable w-full max-w-5xl mx-auto p-6 space-y-6">
        {/* Tab Selector */}
        <div className="flex bg-gray-200 p-1 rounded-2xl max-w-md mx-auto shadow-xs">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${
              activeTab === 'info'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            {t.stockInfo}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 hover:text-brand-charcoal'
            }`}
          >
            {t.historyLog}
          </button>
        </div>

        {activeTab === 'info' ? (
          <>
            {showBanner && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-800 shadow-sm">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span className="font-semibold">{t.itemsLowStock}</span>
              </div>
            )}

            <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold font-heading text-brand-charcoal">{t.shortiesItems}</h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-600 transition-colors active:scale-95 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {t.addNewItem}
              </button>
            </div>

            {isAdding && (
              <ItemForm 
                t={t}
                language={language}
                onSave={(newItem) => {
                  setItems([...items, newItem]);
                  setIsAdding(false);
                }}
                onCancel={() => setIsAdding(false)}
              />
            )}

            <div className="grid grid-cols-1 gap-6">
              {items.map(item => {
                const isEditingThis = editingItem && editingItem.id === item.id;
                return (
                  <div key={item.id} className="relative group">
                    {isEditingThis ? (
                      <ItemForm 
                        t={t}
                        language={language}
                        initialItem={editingItem}
                        onSave={(updatedItem) => {
                          setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
                          setEditingItem(null);
                        }}
                        onCancel={() => setEditingItem(null)}
                      />
                    ) : (
                      <>
                        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingItem(item)}
                            className="p-2 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 shadow-sm"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-white text-red-500 border border-red-200 rounded-xl hover:bg-red-50 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <StockRow 
                          item={item}
                          stockInfo={stockData[item.id] || { frozenQty: 0, friedQty: 0 }}
                          onUpdateFrozen={(qty: number) => updateFrozen(item.id, qty)}
                          onUpdateFried={(qty: number) => updateFried(item.id, qty)}
                          transferQty={transferQtys[item.id] || 0}
                          onUpdateTransferDelta={(delta: number) => handleUpdateTransfer(item.id, delta)}
                          onSetTransferQty={(qty: number) => handleSetTransferQty(item.id, qty)}
                          onTransfer={(qty: number) => handleTransferSubmit(item.id, qty)}
                          language={language}
                          t={t}
                          openNumpad={openNumpad}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold font-heading text-brand-charcoal">{t.historyLog}</h2>
              {logs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(t.confirmClearHistory)) {
                      clearLogs();
                    }
                  }}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-100 transition-colors active:scale-95 text-sm"
                >
                  {t.clearHistory}
                </button>
              )}
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-medium">
                No history records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.timestamp}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.itemName}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t.action}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t.qty}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t.frozenStock}</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">{t.friedStock}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-sm text-brand-charcoal">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.itemName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            log.action === 'SALE' ? 'bg-green-50 text-green-700' :
                            log.action === 'CANCEL_REPLENISH' ? 'bg-blue-50 text-blue-700' :
                            log.action === 'DAMAGE_DEDUCTION' ? 'bg-red-50 text-red-700' :
                            log.action === 'FREE_DEDUCTION' ? 'bg-purple-50 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono font-bold">
                          {log.qty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-gray-500 font-normal">
                          {log.prevFrozen} → <span className="font-bold text-brand-charcoal">{log.newFrozen}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-gray-500 font-normal">
                          {log.prevFried} → <span className="font-bold text-brand-charcoal">{log.newFried}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Numpad Popup Modal */}
      {numpadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-heading font-bold text-brand-charcoal text-center">
              {numpadTitle}
            </h3>
            
            {/* Display */}
            <div className="text-4xl font-heading font-black text-brand-primary my-2 bg-amber-50 px-6 py-2 rounded-2xl border border-amber-100 min-w-[150px] text-center font-mono">
              {numpadValue || '0'}
            </div>
            
            {/* Keyboard */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setNumpadValue(prev => {
                      if (prev === '0') return String(num);
                      return prev + num;
                    });
                  }}
                  className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-lg font-heading font-bold text-brand-charcoal flex items-center justify-center outline-none"
                >
                  {num}
                </button>
              ))}
              
              {/* Row 4: C, 0, Backspace */}
              <button
                type="button"
                onClick={() => setNumpadValue('0')}
                className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-lg font-heading font-bold text-brand-charcoal flex items-center justify-center outline-none"
              >
                {t.clear}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setNumpadValue(prev => {
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
                  setNumpadValue(prev => {
                    if (prev.length <= 1) return '0';
                    return prev.slice(0, -1);
                  });
                }}
                className="h-12 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-brand-charcoal flex items-center justify-center outline-none"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 w-full mt-4">
              <button
                type="button"
                onClick={() => {
                  setNumpadOpen(false);
                  setNumpadCallback(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-colors"
              >
                {t.cancel}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (numpadCallback) {
                    numpadCallback(Number(numpadValue));
                  }
                  setNumpadOpen(false);
                  setNumpadCallback(null);
                }}
                className="flex-1 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-amber-700 active:scale-95 transition-colors"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemForm({ t, language, initialItem, onSave, onCancel }: any) {
  const [nameEn, setNameEn] = useState(initialItem?.nameEn || (initialItem ? '' : ''));
  const [nameTa, setNameTa] = useState(initialItem?.nameTa || '');
  const [price, setPrice] = useState(initialItem?.price?.toString() || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const itemId = initialItem?.id || `custom_${Date.now()}`;
  const [image, setImage] = useItemImage(itemId);

  // If we are editing, we preload the existing name if item was from constants
  useEffect(() => {
    if (initialItem && !initialItem.nameEn) {
      setNameEn(t[initialItem.id as keyof typeof t] || '');
    }
  }, [initialItem, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!nameEn.trim() || !price || isNaN(Number(price))) return;
    
    onSave({
      id: itemId,
      nameEn: nameEn.trim(),
      nameTa: nameTa.trim(),
      price: Number(price)
    });
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-amber-100 flex flex-col gap-4 relative">
      <h3 className="font-bold text-lg font-heading text-brand-charcoal border-b border-gray-100 pb-2">
        {initialItem ? t.edit : t.addNewItem}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 inline-block">
          <span className="text-sm font-semibold text-gray-600">{t.itemNameEn} *</span>
          <input 
            type="text" 
            value={nameEn} 
            onChange={e => setNameEn(e.target.value)}
            className="h-12 px-4 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            placeholder="e.g. Fish Roll"
          />
        </label>
        
        <label className="flex flex-col gap-1 inline-block">
          <span className="text-sm font-semibold text-gray-600">{t.itemNameTa}</span>
          <input 
            type="text" 
            value={nameTa} 
            onChange={e => setNameTa(e.target.value)}
            className="h-12 px-4 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            placeholder="e.g. மீன் ரோல்"
          />
        </label>
        
        <label className="flex flex-col gap-1 inline-block">
          <span className="text-sm font-semibold text-gray-600">{t.unitPrice} *</span>
          <input 
            type="number" 
            min="1"
            value={price} 
            onChange={e => setPrice(e.target.value)}
            className="h-12 px-4 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 inline-block">
          <span className="text-sm font-semibold text-gray-600">{t.imageField}</span>
          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-12 px-4 rounded-xl border border-dashed border-gray-400 text-gray-600 hover:bg-gray-50 font-semibold flex items-center justify-center gap-2 flex-1 outline-none"
            >
              <ImageIcon className="w-5 h-5" />
              {image ? 'Change Image' : 'Select Image'}
            </button>
            {image && (
              <img src={image} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="Preview"/>
            )}
          </div>
        </label>
      </div>

      <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-gray-100">
        <button 
          onClick={onCancel}
          className="px-6 py-2 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95"
        >
          {t.cancel}
        </button>
        <button 
          onClick={handleSave}
          disabled={!nameEn.trim() || !price || isNaN(Number(price))}
          className="px-6 py-2 rounded-xl font-bold bg-brand-primary text-white hover:bg-amber-700 disabled:opacity-50 active:scale-95"
        >
          {initialItem ? t.saveChanges : t.saveItem}
        </button>
      </div>
    </div>
  );
}

function StockRow({ item, stockInfo, onUpdateFrozen, onUpdateFried, transferQty, onUpdateTransferDelta, onSetTransferQty, onTransfer, language, t, openNumpad }: any) {
  const [image] = useItemImage(item.id);
  const [localFrozen, setLocalFrozen] = useState(stockInfo.frozenQty);
  
  // Sync if external changes happen
  useEffect(() => {
    setLocalFrozen(stockInfo.frozenQty);
  }, [stockInfo.frozenQty]);

  const [transferError, setTransferError] = useState('');
  
  const [friedMode, setFriedMode] = useState<'correct' | 'damage' | 'free'>('correct');
  const [deductQty, setDeductQty] = useState(0);
  const [deductError, setDeductError] = useState('');

  const handleTransfer = () => {
    setTransferError('');
    if (!transferQty || isNaN(transferQty) || transferQty <= 0) return;
    
    if (transferQty > stockInfo.frozenQty) {
      setTransferError(t.notEnoughFrozen);
      return;
    }

    onTransfer(transferQty);
  };

  const isLowStock = stockInfo.friedQty > 0 && stockInfo.friedQty <= 5;
  const isOutOfStock = stockInfo.friedQty === 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-wrap md:flex-nowrap gap-8 items-start md:items-stretch relative">
      {(isLowStock || isOutOfStock) && (
        <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl rounded-tr-3xl text-xs font-bold shadow-sm ${
          isOutOfStock ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
        }`}>
          {isOutOfStock ? (
            <div className="flex gap-1 items-center"><span>✕</span> {t.outOfStock}</div>
          ) : (
            <div className="flex gap-1 items-center"><span>⚠</span> {t.lowStock}</div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="flex md:flex-col items-center md:items-start gap-4 md:w-48 shrink-0">
        <div className="w-16 h-16 md:w-full md:h-32 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
          {image ? (
            <img src={image} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-gray-400 text-xs text-center px-2">No Image</span>
          )}
        </div>
        <h3 className="font-heading font-bold text-lg md:text-xl text-brand-charcoal text-balance">
          {t[item.id as keyof typeof t] || item.nameEn}
        </h3>
      </div>

      {/* Controls Section */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full md:pt-2">
        {/* Frozen */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-gray-500 text-sm tracking-wide uppercase">{t.frozenStock}</h4>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setLocalFrozen(Math.max(0, localFrozen - 1));
              }}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
            >-</button>
            <button
              type="button"
              onClick={() => {
                openNumpad(
                  `${t.enterQty} - ${t.frozenStock}`,
                  String(localFrozen),
                  (newVal: number) => setLocalFrozen(newVal)
                );
              }}
              className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-mono font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all text-brand-charcoal outline-none shadow-xs"
            >
              {localFrozen} {t.pcs}
            </button>
            <button 
              onClick={() => {
                setLocalFrozen(localFrozen + 1);
              }}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
            >+</button>
          </div>
          <button 
            onClick={() => onUpdateFrozen(localFrozen)}
            disabled={localFrozen === stockInfo.frozenQty}
            className="mt-2 h-10 w-full bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.updateFrozen}
          </button>
        </div>

        {/* Fried */}
        <div className="flex flex-col gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
          <h4 className="font-semibold text-gray-500 text-sm tracking-wide uppercase flex justify-between">
            {t.friedStock}
            <span className="text-gray-400 text-[10px] lowercase normal-case">({t.manualCorrectionOnly})</span>
          </h4>
          
          {/* Fried Stock Mode Selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setFriedMode('correct')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                friedMode === 'correct' ? 'bg-white text-brand-charcoal shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.correct}
            </button>
            <button
              type="button"
              onClick={() => { setFriedMode('damage'); setDeductQty(0); setDeductError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                friedMode === 'damage' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💥 {t.damage}
            </button>
            <button
              type="button"
              onClick={() => { setFriedMode('free'); setDeductQty(0); setDeductError(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                friedMode === 'free' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎁 {t.free}
            </button>
          </div>

          {friedMode === 'correct' ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onUpdateFried(Math.max(0, stockInfo.friedQty - 1))}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
              >-</button>
              <button
                type="button"
                onClick={() => {
                  openNumpad(
                    `${t.enterQty} - ${t.friedStock} (${t.correct})`,
                    String(stockInfo.friedQty),
                    (newVal: number) => onUpdateFried(newVal)
                  );
                }}
                className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-mono font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all text-brand-charcoal outline-none shadow-xs"
              >
                {stockInfo.friedQty} {t.pcs}
              </button>
              <button 
                onClick={() => onUpdateFried(stockInfo.friedQty + 1)}
                className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
              >+</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => { setDeductError(''); setDeductQty(Math.max(0, deductQty - 1)); }}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
                >-</button>
                <button
                  type="button"
                  onClick={() => {
                    openNumpad(
                      `${t.enterQty} - ${friedMode === 'damage' ? t.damage : t.free}`,
                      String(deductQty),
                      (newVal: number) => {
                        setDeductError('');
                        setDeductQty(newVal);
                      }
                    );
                  }}
                  className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-mono font-bold text-lg hover:bg-gray-100 active:scale-95 transition-all text-gray-700 outline-none shadow-xs"
                >
                  {deductQty} {t.pcs}
                </button>
                <button 
                  type="button"
                  onClick={() => { setDeductError(''); setDeductQty(deductQty + 1); }}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
                >+</button>
              </div>
              {deductError && <p className="text-red-500 text-xs px-1 text-center font-bold">{deductError}</p>}
              <button 
                type="button"
                onClick={() => {
                  setDeductError('');
                  if (deductQty <= 0) return;
                  if (deductQty > stockInfo.friedQty) {
                    setDeductError(t.notEnoughFried);
                    return;
                  }
                  onUpdateFried(stockInfo.friedQty - deductQty);
                  setDeductQty(0);
                }}
                disabled={deductQty <= 0}
                className={`h-11 w-full text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95 ${
                  friedMode === 'damage' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {friedMode === 'damage' ? t.deductDamage : t.deductFree}
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl relative">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">{t.transfer}:</span>
              <button 
                onClick={() => { setTransferError(''); onUpdateTransferDelta(-1); }}
                className="w-11 h-11 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold active:scale-95"
              >-</button>
              <button
                type="button"
                onClick={() => {
                  openNumpad(
                    `${t.enterQty} - ${t.transfer}`,
                    String(transferQty),
                    (newVal: number) => {
                      setTransferError('');
                      onSetTransferQty(newVal);
                    }
                  );
                }}
                className="flex-1 h-11 bg-white border border-gray-300 rounded-xl flex items-center justify-center font-mono font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all outline-none shadow-xs"
              >
                {transferQty} {t.pcs}
              </button>
              <button 
                onClick={() => { setTransferError(''); onUpdateTransferDelta(1); }}
                className="w-11 h-11 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold active:scale-95"
              >+</button>
            </div>
            {transferError && <p className="text-red-500 text-xs px-1 text-center font-bold mb-1">{transferError}</p>}
            <button 
              onClick={handleTransfer}
              disabled={transferQty <= 0}
              className="h-12 w-full action-btn bg-brand-charcoal text-white font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-1"
            >
              {t.transferFrozenToFried}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
