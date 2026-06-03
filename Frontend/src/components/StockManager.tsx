import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, AlertTriangle, Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
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
  const { stockData, updateFrozen, updateFried, transferStock, anyLowStock, anyOutOfStock } = stock;

  const [transferQtys, setTransferQtys] = useState<Record<string, number>>({});
  const [editingItem, setEditingItem] = useState<FixedItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleUpdateTransfer = (itemId: string, delta: number) => {
    setTransferQtys(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
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

        {editingItem && (
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
        )}

        <div className="grid grid-cols-1 gap-6">
          {items.map(item => (
            <div key={item.id} className="relative group">
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
                onTransfer={(qty: number) => handleTransferSubmit(item.id, qty)}
                language={language}
                t={t}
              />
            </div>
          ))}
        </div>
      </div>
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

function StockRow({ item, stockInfo, onUpdateFrozen, onUpdateFried, transferQty, onUpdateTransferDelta, onTransfer, language, t }: any) {
  const [image] = useItemImage(item.id);
  const [localFrozen, setLocalFrozen] = useState(stockInfo.frozenQty);
  
  // Sync if external changes happen
  useEffect(() => {
    setLocalFrozen(stockInfo.frozenQty);
  }, [stockInfo.frozenQty]);

  const [transferError, setTransferError] = useState('');

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
            <div className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-mono font-bold text-lg">
              {localFrozen} {t.pcs}
            </div>
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
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onUpdateFried(Math.max(0, stockInfo.friedQty - 1))}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
            >-</button>
            <div className="flex-1 h-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center font-mono font-bold text-lg">
              {stockInfo.friedQty} {t.pcs}
            </div>
            <button 
              onClick={() => onUpdateFried(stockInfo.friedQty + 1)}
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold active:scale-95"
            >+</button>
          </div>

          <div className="mt-4 flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl relative">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">{t.transfer}:</span>
              <button 
                onClick={() => { setTransferError(''); onUpdateTransferDelta(-1); }}
                className="w-11 h-11 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold active:scale-95"
              >-</button>
              <div className="flex-1 h-11 bg-white border border-gray-300 rounded-xl flex items-center justify-center font-mono font-bold text-gray-700">
                {transferQty} {t.pcs}
              </div>
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
