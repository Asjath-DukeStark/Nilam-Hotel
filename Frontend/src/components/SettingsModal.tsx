import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Pencil, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import { Language, translations } from '../translations';
import { resetAllImages, useItemImage } from '../hooks/useItemImage';
import { DEFAULT_PRICES } from '../constants';

interface SettingsModalProps {
  language: Language;
  onBack: () => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  itemPrices: Record<string, number>;
  setItemPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onToggleLanguage: () => void;
  prices: Record<string, number>;
  setPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  beverageItems: any[];
  setBeverageItems: React.Dispatch<React.SetStateAction<any[]>>;
  hotItems: any[];
  setHotItems: React.Dispatch<React.SetStateAction<any[]>>;
  shortiesItems: any[];
  setShortiesItems: React.Dispatch<React.SetStateAction<any[]>>;
  onOpenStockManager: () => void;
  extraPrices: Record<string, number>;
  setExtraPrices: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

interface PriceInputRowProps {
  key?: string;
  label: string;
  value: number;
  onSave: (val: number) => void;
  minValue?: number;
  t: any;
}

function PriceInputRow({
  label,
  value,
  onSave,
  minValue = 0,
  t
}: PriceInputRowProps) {
  const [localVal, setLocalVal] = useState(String(value));
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const handleBlur = () => {
    let parsed = parseFloat(localVal);
    if (isNaN(parsed) || parsed < minValue) {
      parsed = minValue;
    }
    setLocalVal(String(parsed));
    if (parsed !== value) {
      onSave(parsed);
      setShowTick(true);
      const timer = setTimeout(() => setShowTick(false), 1000);
      return () => clearTimeout(timer);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    setLocalVal(val);
  };

  return (
    <div className="flex justify-between items-center py-2.5 px-3 bg-white hover:bg-gray-50/50 rounded-xl border border-gray-100 transition-colors">
      <span className="font-medium text-gray-700 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {showTick && (
          <span className="text-green-600 font-bold text-sm animate-pulse flex items-center justify-center">✓</span>
        )}
        <span className="text-gray-400 text-xs font-semibold">{t.lkr}</span>
        <input 
          type="text" 
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-[100px] h-9 px-2 text-right border border-gray-200 rounded-lg text-brand-charcoal font-bold text-sm outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors bg-gray-50/50 focus:bg-white"
        />
      </div>
    </div>
  );
}

interface ItemManagerFormProps {
  t: any;
  language: Language;
  initialItem?: { id: string; nameEn?: string; nameTa?: string; price: number };
  onSave: (item: { id: string; nameEn?: string; nameTa?: string; price: number }) => void;
  onCancel: () => void;
  categoryPrefix: 'bev' | 'hot' | 'short';
}

function ItemManagerForm({ t, language, initialItem, onSave, onCancel, categoryPrefix }: ItemManagerFormProps) {
  const [nameEn, setNameEn] = useState(initialItem?.nameEn || '');
  const [nameTa, setNameTa] = useState(initialItem?.nameTa || '');
  const [price, setPrice] = useState(initialItem?.price !== undefined ? initialItem.price.toString() : '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const itemId = initialItem?.id || `${categoryPrefix}_${Date.now()}`;
  const [image, setImage] = useItemImage(itemId);

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
    if (!nameEn.trim()) {
      alert("Name (English) is required.");
      return;
    }
    const parsedPrice = Number(price);
    if (!price || isNaN(parsedPrice) || parsedPrice < 0) {
      alert("Please enter a valid price (minimum 0).");
      return;
    }
    
    onSave({
      id: itemId,
      nameEn: nameEn.trim(),
      nameTa: nameTa.trim(),
      price: parsedPrice
    });
  };

  return (
    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 flex flex-col gap-3 my-3">
      <h4 className="font-heading font-bold text-brand-charcoal text-sm">
        {initialItem ? (language === 'ta' ? 'பொருளை மாற்றியமைக்க' : 'Edit Item') : (language === 'ta' ? 'புதிய பொருள் சேர்க்க' : 'Add New Item')}
      </h4>
      
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">Name (English) *</span>
          <input 
            type="text" 
            value={nameEn} 
            onChange={e => setNameEn(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-gray-300 focus:border-amber-500 bg-white outline-none"
            placeholder="e.g. Lime Juice"
          />
        </label>
        
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">Tamil Name</span>
          <input 
            type="text" 
            value={nameTa} 
            onChange={e => setNameTa(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-gray-300 focus:border-amber-500 bg-white outline-none"
            placeholder="e.g. எலுமிச்சை சாறு"
          />
        </label>
        
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-gray-500">Price (LKR) *</span>
          <input 
            type="number" 
            min="0"
            value={price} 
            onChange={e => setPrice(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-gray-300 focus:border-amber-500 bg-white outline-none"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1 mt-1">
          <span className="text-[11px] font-semibold text-gray-500">Image</span>
          <input 
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageChange}
          />
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3 rounded-lg border border-dashed border-gray-400 text-gray-600 bg-white hover:bg-gray-50 font-semibold text-xs flex items-center justify-center gap-2 flex-1 outline-none transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-gray-500" />
              {image ? 'Change Image' : 'Select Image'}
            </button>
            {image && (
              <img src={image} className="w-9 h-9 rounded-lg object-cover shadow-sm border border-gray-200" alt="Preview"/>
            )}
          </div>
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button 
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 uppercase shadow-xs transition-colors"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-amber-600 uppercase shadow-xs transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export function SettingsModal({
  language,
  onBack,
  restaurantName,
  setRestaurantName,
  itemPrices,
  setItemPrices,
  onToggleLanguage,
  prices,
  setPrices,
  beverageItems,
  setBeverageItems,
  hotItems,
  setHotItems,
  shortiesItems,
  setShortiesItems,
  onOpenStockManager,
  extraPrices,
  setExtraPrices
}: SettingsModalProps) {
  const t = translations[language];

  const [addingCategory, setAddingCategory] = useState<'beverage' | 'hot' | 'shorties' | null>(null);
  const [editingItem, setEditingItem] = useState<{ category: 'beverage' | 'hot' | 'shorties'; item: any } | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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
        <h1 className="font-heading font-bold text-base text-brand-charcoal absolute left-1/2 -translate-x-1/2">
          {t.settings}
        </h1>
        <button 
          onClick={onToggleLanguage}
          className="px-4 py-1.5 bg-brand-charcoal text-white rounded-full font-heading font-semibold hover:bg-black transition-colors active:scale-95 text-xs"
        >
          {language === 'en' ? 'தமிழ்' : 'EN'}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 bg-gray-50/50 max-w-xl mx-auto w-full">
        {/* Section 1: Restaurant Info */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase mb-4">
            {language === 'ta' ? 'உணவகத் தகவல்' : 'Restaurant Info'}
          </h3>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            {t.restaurantName}
          </label>
          <input 
            type="text" 
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl font-bold text-brand-charcoal outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all bg-gray-50/30 text-sm"
          />
        </div>

        {/* Section 2: Price Management */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase mb-4">
            {t.priceManagement}
          </h3>
          <div className="flex flex-col gap-4">
            {/* KOTTU */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.kottu}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={t.normal} 
                  value={prices.kottuNormal ?? 350} 
                  onSave={(val) => setPrices(prev => ({ ...prev, kottuNormal: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={t.full} 
                  value={prices.kottuFull ?? 500} 
                  onSave={(val) => setPrices(prev => ({ ...prev, kottuFull: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* DOLPHIN KOTTU */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.dolphinKottu}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={t.normal} 
                  value={prices.dolphinNormal ?? 350} 
                  onSave={(val) => setPrices(prev => ({ ...prev, dolphinNormal: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={t.full} 
                  value={prices.dolphinFull ?? 500} 
                  onSave={(val) => setPrices(prev => ({ ...prev, dolphinFull: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* RICE */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.rice}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={t.normal} 
                  value={prices.riceNormal ?? 350} 
                  onSave={(val) => setPrices(prev => ({ ...prev, riceNormal: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={t.full} 
                  value={prices.riceFull ?? 500} 
                  onSave={(val) => setPrices(prev => ({ ...prev, riceFull: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* DHOSAI */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.dhosai}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={language === 'ta' ? 'மாட்டிறைச்சி' : 'Beef'} 
                  value={prices.dhosaBeef ?? 200} 
                  onSave={(val) => setPrices(prev => ({ ...prev, dhosaBeef: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={language === 'ta' ? 'கூடுதல்' : 'Extra'} 
                  value={prices.dhosaExtra ?? 250} 
                  onSave={(val) => setPrices(prev => ({ ...prev, dhosaExtra: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* MEALS */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.meals}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={`${t.idiyappam} · ${t.plain} (${language === 'ta' ? 'ஒன்று' : 'Per Piece'})`}
                  value={prices.mealsIdiyappamPlain ?? 10} 
                  onSave={(val) => setPrices(prev => ({ ...prev, mealsIdiyappamPlain: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.idiyappam} · ${t.sambal} (${language === 'ta' ? 'ஒன்று' : 'Per Piece'})`}
                  value={prices.mealsIdiyappamSambal ?? 12.50} 
                  onSave={(val) => setPrices(prev => ({ ...prev, mealsIdiyappamSambal: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.rotti} / ${t.parata} · ${t.plain} (${language === 'ta' ? 'ஒன்று' : 'Per Piece'})`}
                  value={prices.mealsParataPlain ?? 30} 
                  onSave={(val) => setPrices(prev => ({ ...prev, mealsParataPlain: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.rotti} / ${t.parata} · ${t.sambal} (${language === 'ta' ? 'ஒன்று' : 'Per Piece'})`}
                  value={prices.mealsParataSambal ?? 33.33} 
                  onSave={(val) => setPrices(prev => ({ ...prev, mealsParataSambal: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.nocurry}`} 
                  value={prices.nocurry ?? 0} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, nocurry: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.dhalcurry}`} 
                  value={prices.dhalcurry ?? 50} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, dhalcurry: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.eggcurry}`} 
                  value={prices.eggcurry ?? 80} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, eggcurry: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.fishcurry}`} 
                  value={prices.fishcurry ?? 120} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, fishcurry: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.chickencurry}`} 
                  value={prices.chickencurry ?? 150} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, chickencurry: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={`${t.curry} · ${t.beefcurry}`} 
                  value={prices.beefcurry ?? 180} 
                  minValue={0}
                  onSave={(val) => setPrices(prev => ({ ...prev, beefcurry: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* GRAVY */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">{t.gravy}</h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={t.onePortion} 
                  value={prices.gravyOnePortion ?? 100} 
                  onSave={(val) => setPrices(prev => ({ ...prev, gravyOnePortion: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={t.halfPortion} 
                  value={prices.gravyHalfPortion ?? 50} 
                  onSave={(val) => setPrices(prev => ({ ...prev, gravyHalfPortion: val }))}
                  t={t}
                />
              </div>
            </div>

            {/* EXTRA PRICES */}
            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
              <h4 className="font-bold text-xs text-brand-charcoal mb-2 uppercase tracking-wide">
                {language === 'ta' ? 'கூடுதல் விலைகள்' : 'Extra Prices'}
              </h4>
              <div className="flex flex-col gap-2">
                <PriceInputRow 
                  label={language === 'ta' ? 'கூடுதல் கோழி' : 'Extra Chicken'} 
                  value={extraPrices.extraChicken ?? 100} 
                  onSave={(val) => setExtraPrices(prev => ({ ...prev, extraChicken: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={language === 'ta' ? 'கூடுதல் மாடு' : 'Extra Beef'} 
                  value={extraPrices.extraBeef ?? 120} 
                  onSave={(val) => setExtraPrices(prev => ({ ...prev, extraBeef: val }))}
                  t={t}
                />
                <PriceInputRow 
                  label={language === 'ta' ? 'கூடுதல் முட்டை' : 'Extra Egg'} 
                  value={extraPrices.extraEgg ?? 50} 
                  onSave={(val) => setExtraPrices(prev => ({ ...prev, extraEgg: val }))}
                  t={t}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Shorties Items */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase">
              {t.shorties}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onOpenStockManager}
                className="flex items-center gap-1 bg-brand-charcoal text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-black transition-colors active:scale-95 shadow-xs"
              >
                {t.stockManagement || 'Stock'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setAddingCategory('shorties');
                  setEditingItem(null);
                }}
                className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-amber-600 transition-colors active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'ta' ? 'சேர்க்க' : 'Add'}
              </button>
            </div>
          </div>

          {addingCategory === 'shorties' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="short"
              onSave={(newItem) => {
                setShortiesItems(prev => [...prev, newItem]);
                setAddingCategory(null);
              }}
              onCancel={() => setAddingCategory(null)}
            />
          )}

          {editingItem && editingItem.category === 'shorties' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="short"
              initialItem={editingItem.item}
              onSave={(updatedItem) => {
                setShortiesItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {shortiesItems.map((short) => {
              const isSelectedForDelete = deletingItemId === short.id;

              if (isSelectedForDelete) {
                return (
                  <div key={short.id} className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200/50 rounded-xl w-full animate-fade-in">
                    <div className="text-xs font-semibold text-red-700 leading-tight">
                      {language === 'ta' ? `${short.nameTa || short.nameEn} ஐ நீக்கவா? இதை செயல்தவிர்க்க முடியாது.` : `Delete ${short.nameEn}? This cannot be undone.`}
                    </div>
                    <div className="flex justify-end gap-1.5 mt-1">
                      <button 
                        type="button"
                        onClick={() => setDeletingItemId(null)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (shortiesItems.length <= 1) {
                            alert(language === 'ta' ? 'கடைசி பொருளை நீக்க முடியாது!' : 'Cannot delete the last remaining item.');
                            setDeletingItemId(null);
                            return;
                          }
                          setShortiesItems(prev => prev.filter(i => i.id !== short.id));
                          window.localStorage.removeItem(`img_${short.id}`);
                          setDeletingItemId(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-red-650 hover:bg-red-700 text-white rounded-lg uppercase"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={short.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50/50 rounded-xl border border-gray-100 transition-colors">
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-semibold text-gray-700 text-xs block truncate">{short.nameEn}</span>
                    {short.nameTa && <span className="text-[10px] text-gray-400 block truncate mt-0.5">{short.nameTa}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-gray-400 text-[10px] font-semibold">{t.lkr}</span>{' '}
                    <span className="text-brand-charcoal font-bold text-xs">{short.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingItem({ category: 'shorties', item: short });
                        setAddingCategory(null);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDeletingItemId(short.id);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Beverage Items */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase">
              {t.beverage}
            </h3>
            <button 
              type="button"
              onClick={() => {
                setAddingCategory('beverage');
                setEditingItem(null);
              }}
              className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-amber-600 transition-colors active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {language === 'ta' ? 'சேர்க்க' : 'Add'}
            </button>
          </div>

          {addingCategory === 'beverage' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="bev"
              onSave={(newItem) => {
                setBeverageItems(prev => [...prev, newItem]);
                setAddingCategory(null);
              }}
              onCancel={() => setAddingCategory(null)}
            />
          )}

          {editingItem && editingItem.category === 'beverage' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="bev"
              initialItem={editingItem.item}
              onSave={(updatedItem) => {
                setBeverageItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {beverageItems.map((bev) => {
              const isSelectedForDelete = deletingItemId === bev.id;

              if (isSelectedForDelete) {
                return (
                  <div key={bev.id} className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200/50 rounded-xl w-full animate-fade-in">
                    <div className="text-xs font-semibold text-red-700 leading-tight">
                      {language === 'ta' ? `${bev.nameTa || bev.nameEn} ஐ நீக்கவா? இதை செயல்தவிர்க்க முடியாது.` : `Delete ${bev.nameEn}? This cannot be undone.`}
                    </div>
                    <div className="flex justify-end gap-1.5 mt-1">
                      <button 
                        type="button"
                        onClick={() => setDeletingItemId(null)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (beverageItems.length <= 1) {
                            alert(language === 'ta' ? 'கடைசி பொருளை நீக்க முடியாது!' : 'Cannot delete the last remaining item.');
                            setDeletingItemId(null);
                            return;
                          }
                          setBeverageItems(prev => prev.filter(i => i.id !== bev.id));
                          window.localStorage.removeItem(`img_${bev.id}`);
                          setDeletingItemId(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg uppercase"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={bev.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50/50 rounded-xl border border-gray-100 transition-colors">
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-semibold text-gray-700 text-xs block truncate">{bev.nameEn}</span>
                    {bev.nameTa && <span className="text-[10px] text-gray-400 block truncate mt-0.5">{bev.nameTa}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-gray-400 text-[10px] font-semibold">{t.lkr}</span>{' '}
                    <span className="text-brand-charcoal font-bold text-xs">{bev.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingItem({ category: 'beverage', item: bev });
                        setAddingCategory(null);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDeletingItemId(bev.id);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Hot Items */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase">
              {t.hot}
            </h3>
            <button 
              type="button"
              onClick={() => {
                setAddingCategory('hot');
                setEditingItem(null);
              }}
              className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-amber-600 transition-colors active:scale-95 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {language === 'ta' ? 'சேர்க்க' : 'Add'}
            </button>
          </div>

          {addingCategory === 'hot' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="hot"
              onSave={(newItem) => {
                setHotItems(prev => [...prev, newItem]);
                setAddingCategory(null);
              }}
              onCancel={() => setAddingCategory(null)}
            />
          )}

          {editingItem && editingItem.category === 'hot' && (
            <ItemManagerForm 
              t={t}
              language={language}
              categoryPrefix="hot"
              initialItem={editingItem.item}
              onSave={(updatedItem) => {
                setHotItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {hotItems.map((hot) => {
              const isSelectedForDelete = deletingItemId === hot.id;

              if (isSelectedForDelete) {
                return (
                  <div key={hot.id} className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200/50 rounded-xl w-full animate-fade-in">
                    <div className="text-xs font-semibold text-red-700 leading-tight">
                      {language === 'ta' ? `${hot.nameTa || hot.nameEn} ஐ நீக்கவா? இதை செயல்தவிர்க்க முடியாது.` : `Delete ${hot.nameEn}? This cannot be undone.`}
                    </div>
                    <div className="flex justify-end gap-1.5 mt-1">
                      <button 
                        type="button"
                        onClick={() => setDeletingItemId(null)}
                        className="px-2.5 py-1 text-[10px] font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 uppercase"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (hotItems.length <= 1) {
                            alert(language === 'ta' ? 'கடைசி பொருளை நீக்க முடியாது!' : 'Cannot delete the last remaining item.');
                            setDeletingItemId(null);
                            return;
                          }
                          setHotItems(prev => prev.filter(i => i.id !== hot.id));
                          window.localStorage.removeItem(`img_${hot.id}`);
                          setDeletingItemId(null);
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold bg-red-650 hover:bg-red-750 text-white rounded-lg uppercase"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={hot.id} className="flex items-center justify-between p-3 bg-white hover:bg-gray-50/50 rounded-xl border border-gray-100 transition-colors">
                  <div className="flex-1 min-w-0 pr-1">
                    <span className="font-semibold text-gray-700 text-xs block truncate">{hot.nameEn}</span>
                    {hot.nameTa && <span className="text-[10px] text-gray-400 block truncate mt-0.5">{hot.nameTa}</span>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-gray-400 text-[10px] font-semibold">{t.lkr}</span>{' '}
                    <span className="text-brand-charcoal font-bold text-xs">{hot.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingItem({ category: 'hot', item: hot });
                        setAddingCategory(null);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDeletingItemId(hot.id);
                      }}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 6: Reset Options */}
        <div className="bg-white rounded-[14px] p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 mb-8">
          <h3 className="text-[13px] font-bold tracking-wider text-gray-400 uppercase mb-4">
            {language === 'ta' ? 'அமைப்புகளை மீட்டமை' : 'Reset Options'}
          </h3>
          <div className="flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => {
                if(window.confirm(language === 'ta' ? 'பதிவேற்றிய அனைத்து படங்களையும் முற்றிலும் மீட்டமைக்க விரும்புகிறீர்களா?' : 'Are you sure you want to completely reset all uploaded images?')) {
                  resetAllImages();
                }
              }}
              className="w-full py-3 border-2 border-dashed border-red-500 hover:border-red-600 text-red-500 hover:text-red-600 rounded-xl font-heading font-bold hover:bg-red-50/50 transition-colors active:scale-95 shadow-2xs text-xs uppercase"
            >
              {t.resetImages}
            </button>
            <button 
              type="button"
              onClick={() => {
                if(window.confirm(language === 'ta' ? 'அனைத்து விலைகளையும் இயல்புநிலைக்கு மீட்டமைக்க விரும்புகிறீர்களா?' : 'Are you sure you want to completely reset all prices to defaults?')) {
                  setPrices(DEFAULT_PRICES);
                  setItemPrices({});
                }
              }}
              className="w-full py-3 border-2 border-dashed border-brand-charcoal hover:border-black text-brand-charcoal hover:text-black rounded-xl font-heading font-bold hover:bg-gray-100 transition-colors active:scale-95 shadow-2xs text-xs uppercase"
            >
              {language === 'ta' ? 'விலைகளை மீட்டமை' : 'Reset Prices to Default'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
