import { useState } from 'react';
import { Language, translations } from '../translations';
import { BillItem } from '../types';

interface BillModalProps {
  key?: string | number;
  language: Language;
  items: BillItem[];
  mode: 'DINE_IN' | 'TAKEAWAY' | null;
  orderType: 'takeaway' | 'dineIn' | 'both';
  tableNumber: string;
  phone?: string;
  restaurantName: string;
  onNewBill: () => void;
  extraPrices?: Record<string, number>;
  isViewOnly?: boolean;
  invoiceNo?: string;
  payStatus?: string;
  date?: string;
  time?: string;
  onCloseViewOnly?: () => void;
  onEditItem?: (idx: number) => void;
  onDeleteItem?: (idx: number) => void;
  onAddMoreItems?: () => void;
  onSaveInvoice?: (payStatus: 'pay' | 'paid', phone: string, printLanguage: 'en' | 'ta', invoiceNo: string) => void;
  onCancelCheckout?: () => void;
  onUpdatePayStatus?: (invoiceNo: string, newStatus: 'pay' | 'paid') => void;
  onUpdatePhone?: (invoiceNo: string, newPhone: string) => void;
  onEditHistoricalInvoice?: () => void;
}

export function BillModal({ 
  language, 
  items, 
  mode, 
  orderType, 
  tableNumber, 
  phone: phoneProp, 
  restaurantName, 
  onNewBill, 
  extraPrices,
  isViewOnly = false,
  invoiceNo: invoiceNoProp,
  payStatus: payStatusProp,
  date: dateProp,
  time: timeProp,
  onCloseViewOnly,
  onEditItem,
  onDeleteItem,
  onAddMoreItems,
  onSaveInvoice,
  onCancelCheckout,
  onUpdatePayStatus,
  onUpdatePhone,
  onEditHistoricalInvoice
}: BillModalProps) {
  const [activeInvoiceNo, setActiveInvoiceNo] = useState<string>('');
  const [activePayStatus, setActivePayStatus] = useState<string>(payStatusProp || '');
  const [printLanguage, setPrintLanguage] = useState<'en' | 'ta'>(language);
  const [phone, setPhone] = useState(phoneProp || '');

  const activeT = translations[printLanguage];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const getFormattedDate = () => {
    if (!dateProp) {
      const now = new Date();
      const YYYY = now.getFullYear();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const DD = String(now.getDate()).padStart(2, '0');
      return `${DD}/${MM}/${YYYY}`;
    }
    if (dateProp.includes('-')) {
      const [yyyy, mm, dd] = dateProp.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateProp;
  };

  const timeToRender = timeProp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const invoiceNoToRender = isViewOnly ? invoiceNoProp : (activeInvoiceNo || undefined);
  const payStatusToRender = isViewOnly ? payStatusProp : (activePayStatus || undefined);

  const generateInvoiceNo = () => {
    const last = parseInt(localStorage.getItem('last_invoice_no') || '0');
    const next = last + 1;
    localStorage.setItem('last_invoice_no', next.toString());
    return 'INV-' + next.toString().padStart(4, '0');
  };

  const handleSave = (triggerPrint: boolean, status: 'pay' | 'paid') => {
    if (onSaveInvoice) {
      const generatedNo = generateInvoiceNo();
      setActiveInvoiceNo(generatedNo);
      setActivePayStatus(status);
      
      if (triggerPrint) {
        // Allow state rendering to complete before print dialog blocks execution
        setTimeout(() => {
          window.print();
          onSaveInvoice(status, phone, printLanguage, generatedNo);
        }, 150);
      } else {
        onSaveInvoice(status, phone, printLanguage, generatedNo);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-gray-100 z-50 overflow-y-auto pb-8">
      <div className="flex-1 overflow-auto flex flex-col items-center justify-start p-6">
        
        {/* Printable Area */}
        <div className="bg-white text-black p-6 shadow-2xl max-w-[480px] w-full font-mono text-[length:var(--font-sm)] print:shadow-none print:m-0 print:p-0 print:w-full print:max-h-full print:overflow-visible relative overflow-hidden">
          
          {/* Diagonal Seal Watermark */}
          {payStatusToRender && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
              <div 
                style={{
                  transform: 'rotate(-25deg)',
                  color: payStatusToRender === 'paid' ? '#16A34A' : '#DC2626',
                  borderColor: payStatusToRender === 'paid' ? '#16A34A' : '#DC2626',
                  opacity: 0.15,
                }} 
                className="border-8 text-4xl font-black px-5 py-2 uppercase tracking-widest rounded-3xl whitespace-nowrap"
              >
                {payStatusToRender === 'paid' 
                  ? (printLanguage === 'ta' ? 'செலுத்தப்பட்டது' : 'PAID') 
                  : (printLanguage === 'ta' ? 'செலுத்த வேண்டும்' : 'TO PAY')}
              </div>
            </div>
          )}

          <div className="text-center mb-6 z-10 relative">
            <h1 className="text-[length:var(--font-xl)] font-bold mb-2">{restaurantName}</h1>
            <p className="border-b border-dashed border-gray-400 pb-4 text-xs">
              {printLanguage === 'ta' ? 'தேதி:' : 'Date:'} {getFormattedDate()} &nbsp; {printLanguage === 'ta' ? 'நேரம்:' : 'Time:'} {timeToRender}
            </p>
          </div>

          <div className="mb-4 text-[length:var(--font-sm)] flex flex-col gap-1 z-10 relative">
            {invoiceNoToRender && (
              <div className="flex justify-between border-b border-gray-100 pb-1 mb-1">
                <span>{printLanguage === 'ta' ? 'இன்வாய்ஸ் எண்:' : 'Invoice No:'}</span>
                <span className="font-semibold">{invoiceNoToRender}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{printLanguage === 'ta' ? 'பயன்முறை:' : 'Mode:'}</span>
              <span className="font-semibold">
                {mode === 'DINE_IN' 
                  ? (printLanguage === 'ta' ? 'உள்ளே உண்ணுதல்' : 'Dine-in') 
                  : (printLanguage === 'ta' ? 'பார்சல்' : 'Takeaway')}
              </span>
            </div>
            {mode === 'DINE_IN' && (
              <>
                <div className="flex justify-between">
                  <span>{printLanguage === 'ta' ? 'ஆர்டர் வகை:' : 'Order Type:'}</span>
                  <span className="font-semibold">{activeT[orderType as keyof typeof activeT]}</span>
                </div>
                {tableNumber && (
                  <div className="flex justify-between">
                    <span>{printLanguage === 'ta' ? 'மேசை எண்:' : 'Table No:'}</span>
                    <span className="font-semibold">{tableNumber}</span>
                  </div>
                )}
              </>
            )}
            {phone && (
              <div className="flex justify-between">
                <span>{printLanguage === 'ta' ? 'தொலைபேசி:' : 'Phone:'}</span>
                <span className="font-semibold">{phone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-4 my-4 flex flex-col gap-3 text-[length:var(--font-md)] z-10 relative">
            {items.map((item, idx) => {
              const categoryLabel = activeT[item.categoryId as keyof typeof activeT] || item.categoryId;
              const baseTypeLabel = item.baseType ? activeT[item.baseType as keyof typeof activeT] : null;
              const subTypeLabel = item.subType ? activeT[item.subType as keyof typeof activeT] : null;
              
              const isKottuFlow = ['kottu', 'dolphinKottu', 'rice'].includes(item.categoryId);
              
              let proteinsLabel = null;
              let sizeLabel = null;
              
              if (isKottuFlow) {
                const sizeMode = item.sizeMode || '';
                const hasExtra = sizeMode.includes('extra');
                
                const firstProtein = (item.proteins || []).find((pr: any) => {
                  const prName = typeof pr === 'string' ? pr : pr.name;
                  return prName !== 'extra';
                });
                const fallbackMain = firstProtein ? (typeof firstProtein === 'string' ? firstProtein : firstProtein.name) : undefined;
                const actualMain = item.mainProtein || fallbackMain;

                if (actualMain) {
                  proteinsLabel = activeT[actualMain.toLowerCase() as keyof typeof activeT] || actualMain;
                }

                if (hasExtra) {
                  const breakdownParts: string[] = [];
                  (item.proteins || []).forEach((p: any) => {
                    const pName = typeof p === 'string' ? p : p.name;
                    const pQty = typeof p === 'string' ? 1 : p.qty;
                    if (pName === 'extra') return;
                    
                    const translatedName = activeT[pName.toLowerCase() as keyof typeof activeT] || pName;
                    const priceKey = `extra${pName.charAt(0).toUpperCase()}${pName.slice(1).toLowerCase()}`;
                    const unitPrice = (extraPrices && extraPrices[priceKey]) ?? (priceKey === 'extraChicken' ? 100 : priceKey === 'extraBeef' ? 120 : priceKey === 'extraEgg' ? 50 : 0);
                    
                    const isMain = pName === actualMain;
                    if (isMain) {
                      const extraQty = pQty - 1;
                      if (extraQty > 0) {
                        breakdownParts.push(`${translatedName}×${extraQty} @ LKR${unitPrice}`);
                      }
                    } else {
                      breakdownParts.push(`${translatedName}×${pQty} @ LKR${unitPrice}`);
                    }
                  });
                  const breakdown = breakdownParts.join(' + ');
                  
                  const extraSuffix = breakdown ? `(${breakdown})` : '';
                  const extraWord = activeT.extra || 'Extra';
                  if (sizeMode === 'normal_extra') {
                    sizeLabel = `${activeT.normal} + ${extraWord}${extraSuffix}`;
                  } else if (sizeMode === 'full_extra') {
                    sizeLabel = `${activeT.full} + ${extraWord}${extraSuffix}`;
                  } else {
                    sizeLabel = `${extraWord}${extraSuffix}`;
                  }
                } else {
                  if (sizeMode === 'normal') {
                    sizeLabel = activeT.normal;
                  } else if (sizeMode === 'full') {
                    sizeLabel = activeT.full;
                  }
                }
              } else {
                proteinsLabel = item.proteins && item.proteins.length > 0 
                  ? item.proteins.map((p: any) => {
                      const pName = typeof p === 'string' ? p : p.name;
                      return activeT[pName.toLowerCase() as keyof typeof activeT] || pName;
                    }).join(' + ') 
                  : null;
                sizeLabel = item.sizeMode ? activeT[item.sizeMode as keyof typeof activeT] || item.sizeMode : null;
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
                titleStr += ` x ${item.qty}`;
              }

              return (
                <div key={`${item.id}-${idx}`} className="flex flex-col gap-1 border-b border-dashed border-gray-100 pb-2 mb-1 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex justify-between items-start gap-4">
                    <span className="flex-1 break-words leading-tight">{titleStr}</span>
                    <span className="whitespace-nowrap font-medium text-right">
                      {item.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Edit and Delete Buttons (Checkout Mode only, Screen only) */}
                  {!isViewOnly && (
                    <div className="flex gap-4 mt-1.5 print:hidden text-xs font-sans">
                      <button
                        onClick={() => onEditItem && onEditItem(idx)}
                        className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        ✏️ {printLanguage === 'ta' ? 'திருத்து' : 'Edit'}
                      </button>
                      <button
                        onClick={() => onDeleteItem && onDeleteItem(idx)}
                        className="text-red-500 hover:text-red-600 font-bold flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        🗑️ {printLanguage === 'ta' ? 'நீக்கு' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[length:var(--font-lg)] font-bold pt-2 z-10 relative">
            <span>{printLanguage === 'ta' ? 'மொத்தம்' : 'TOTAL'}</span>
            <span>{activeT.lkr} {total.toFixed(2)}</span>
          </div>

          <div className="text-center mt-12 text-[length:var(--font-xs)] text-gray-500 z-10 relative">
            {printLanguage === 'ta' ? 'நன்றி! மீண்டும் வருக.' : 'Thank you! Come again.'}
          </div>
        </div>

        {/* Print Language Selector Config (Screen only) */}
        <div className="flex flex-col gap-1.5 w-full max-w-[480px] mx-auto print:hidden bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-4">
          <span className="text-xs font-semibold text-gray-500">
            {printLanguage === 'ta' ? 'அச்சு மொழி:' : 'Print Language:'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPrintLanguage('en')}
              className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold transition-all active:scale-95 border ${
                printLanguage === 'en'
                  ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setPrintLanguage('ta')}
              className={`flex-1 py-2 rounded-xl text-xs font-heading font-bold transition-all active:scale-95 border ${
                printLanguage === 'ta'
                  ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Customer Phone Number Config Input (Screen only) */}
        <div className="flex flex-col gap-1.5 w-full max-w-[480px] mx-auto print:hidden bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mt-3">
          <span className="text-xs font-semibold text-gray-500">
            {printLanguage === 'ta' ? 'வாடிக்கையாளர் தொலைபேசி (விரும்பினால்):' : 'Customer Phone (optional):'}
          </span>
          <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden items-center focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-white transition-all mt-1">
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPhone(val);
                if (isViewOnly && onUpdatePhone && invoiceNoToRender) {
                  onUpdatePhone(invoiceNoToRender, val);
                }
              }}
              placeholder="e.g. 0771234567"
              className="flex-1 py-2.5 px-3 bg-transparent outline-none font-heading font-bold text-brand-charcoal text-[16px] w-full"
            />
            {phone && (
              <button
                type="button"
                onClick={() => {
                  setPhone('');
                  if (isViewOnly && onUpdatePhone && invoiceNoToRender) {
                    onUpdatePhone(invoiceNoToRender, '');
                  }
                }}
                className="p-2 mr-1 text-gray-400 hover:text-brand-charcoal font-bold text-lg active:scale-90 transition-transform"
              >
                ×
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Action Bars (Screen only) */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0 print:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] w-full sticky bottom-0 z-25">
        {isViewOnly ? (
          <div className="max-w-md mx-auto flex flex-wrap gap-2 justify-center">
            <button
              onClick={onCloseViewOnly}
              className="w-[calc(50%-4px)] action-btn bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-xl font-heading font-bold active:scale-95 transition-all outline-none text-xs py-2.5"
            >
              {activeT.close || 'Close'}
            </button>
            <button
              onClick={() => onEditHistoricalInvoice && onEditHistoricalInvoice()}
              className="w-[calc(50%-4px)] action-btn bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-heading font-bold active:scale-95 transition-all outline-none text-xs py-2.5"
            >
              ✏️ {printLanguage === 'ta' ? 'திருத்து' : 'Edit'}
            </button>
            {activePayStatus === 'pay' ? (
              <button
                onClick={() => {
                  setActivePayStatus('paid');
                  if (onUpdatePayStatus && invoiceNoToRender) {
                    onUpdatePayStatus(invoiceNoToRender, 'paid');
                  }
                }}
                className="w-[calc(50%-4px)] action-btn bg-green-600 hover:bg-green-700 text-white rounded-xl font-heading font-bold active:scale-95 transition-all shadow-md outline-none text-xs py-2.5"
              >
                {printLanguage === 'ta' ? 'செலுத்தப்பட்டது' : 'Mark as PAID'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setActivePayStatus('pay');
                  if (onUpdatePayStatus && invoiceNoToRender) {
                    onUpdatePayStatus(invoiceNoToRender, 'pay');
                  }
                }}
                className="w-[calc(50%-4px)] action-btn bg-red-600 hover:bg-red-700 text-white rounded-xl font-heading font-bold active:scale-95 transition-all shadow-md outline-none text-xs py-2.5"
              >
                {printLanguage === 'ta' ? 'செலுத்த வேண்டும்' : 'Mark as TO PAY'}
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="w-[calc(50%-4px)] action-btn bg-brand-charcoal hover:bg-black text-white rounded-xl font-heading font-bold active:scale-95 transition-all shadow-lg outline-none text-xs py-2.5"
            >
              🖨️ {printLanguage === 'ta' ? 'அச்சிடு' : 'Reprint'}
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto flex flex-wrap sm:flex-nowrap gap-2 justify-center">
            <button
              onClick={onCancelCheckout}
              className="w-[calc(50%-4px)] sm:w-auto sm:flex-1 action-btn bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-xl font-heading font-bold active:scale-95 transition-all outline-none text-xs py-2.5"
            >
              {activeT.cancel || 'Cancel'}
            </button>
            
            <button
              onClick={onAddMoreItems}
              className="w-[calc(50%-4px)] sm:w-auto sm:flex-1 action-btn bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl font-heading font-bold active:scale-95 transition-all outline-none text-xs py-2.5"
            >
              + {printLanguage === 'ta' ? 'மேலும் சேர்க்க' : 'Add More'}
            </button>
            
            <button
              onClick={() => handleSave(false, 'pay')}
              className="w-[calc(50%-4px)] sm:w-auto sm:flex-1 action-btn bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-heading font-bold active:scale-95 transition-all outline-none text-xs py-2.5"
            >
              💾 {printLanguage === 'ta' ? 'சேமி' : 'Save'}
            </button>
            
            <button
              onClick={() => handleSave(true, 'pay')}
              className="w-[calc(50%-4px)] sm:w-auto sm:flex-1 action-btn bg-red-600 hover:bg-red-700 text-white rounded-xl font-heading font-bold active:scale-95 transition-all shadow-md outline-none text-xs py-2.5"
            >
              🔴 {printLanguage === 'ta' ? 'செலுத்த அச்சிடு' : 'TO PAY'}
            </button>
            
            <button
              onClick={() => handleSave(true, 'paid')}
              className="w-full sm:w-auto sm:flex-1 action-btn bg-green-600 hover:bg-green-700 text-white rounded-xl font-heading font-bold active:scale-95 transition-all shadow-md outline-none text-xs py-2.5"
            >
              🟢 {printLanguage === 'ta' ? 'செலுத்திய பின் அச்சிடு' : 'PAID'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
