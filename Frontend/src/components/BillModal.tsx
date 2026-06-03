import { Language, translations } from '../translations';
import { BillItem } from '../types';
import { RESTAURANT_NAME } from '../constants';

interface BillModalProps {
  key?: string | number;
  language: Language;
  items: BillItem[];
  mode: 'DINE_IN' | 'TAKEAWAY' | null;
  orderType: 'takeaway' | 'dineIn' | 'both';
  tableNumber: string;
  restaurantName: string;
  onNewBill: () => void;
}

export function BillModal({ language, items, mode, orderType, tableNumber, restaurantName, onNewBill }: BillModalProps) {
  const t = translations[language];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-gray-100 z-50">
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        
        {/* Printable Area */}
        <div className="bg-white text-black p-6 shadow-2xl max-w-[480px] max-h-[85vh] overflow-y-auto w-full font-mono text-[length:var(--font-sm)] print:shadow-none print:m-0 print:p-0 print:w-full print:max-h-full print:overflow-visible">
          
          <div className="text-center mb-6">
            <h1 className="text-[length:var(--font-xl)] font-bold mb-2">{restaurantName}</h1>
            <p className="border-b border-dashed border-gray-400 pb-4">
              Date: {dateStr} {timeStr}
            </p>
          </div>

          <div className="mb-4 text-[length:var(--font-sm)] flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className="font-semibold">{mode === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}</span>
            </div>
            {mode === 'DINE_IN' && (
              <>
                <div className="flex justify-between">
                  <span>Order Type:</span>
                  <span className="font-semibold">{t[orderType as keyof typeof t]}</span>
                </div>
                {tableNumber && (
                  <div className="flex justify-between">
                    <span>Table No:</span>
                    <span className="font-semibold">{tableNumber}</span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-b border-dashed border-gray-400 py-4 my-4 flex flex-col gap-2 text-[length:var(--font-md)]">
            {items.map((item, idx) => {
              const categoryLabel = t[item.categoryId as keyof typeof t] || item.categoryId;
              const baseTypeLabel = item.baseType ? t[item.baseType as keyof typeof t] : null;
              const subTypeLabel = item.subType ? t[item.subType as keyof typeof t] : null;
              const proteinsLabel = item.proteins && item.proteins.length > 0 ? item.proteins.map(p => t[p as keyof typeof t] || p).join(' + ') : null;
              const sizeLabel = item.sizeMode ? t[item.sizeMode as keyof typeof t] || item.sizeMode : null;
              
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
                <div key={`${item.id}-${idx}`} className="flex justify-between items-start gap-4">
                  <span className="flex-1 break-words">{titleStr}</span>
                  <span className="whitespace-nowrap font-medium text-right">
                    {item.price.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[length:var(--font-lg)] font-bold pt-2">
            <span>TOTAL</span>
            <span>{t.lkr} {total.toFixed(2)}</span>
          </div>

          <div className="text-center mt-12 text-[length:var(--font-xs)] text-gray-500">
            Thank you! Come again.
          </div>
        </div>

      </div>

      {/* Action Bar - Hidden during print */}
      <div className="p-4 bg-white border-t border-gray-200 flex flex-col md:flex-row items-center justify-center gap-4 shrink-0 print:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={onNewBill}
          className="w-full md:w-auto flex-1 action-btn bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-2xl font-heading font-bold active:scale-95 transition-all outline-none"
        >
          {t.newBill}
        </button>
        <button
          onClick={handlePrint}
          className="w-full md:w-auto flex-1 action-btn bg-brand-charcoal hover:bg-black text-white rounded-2xl font-heading font-bold active:scale-95 transition-all shadow-lg outline-none"
        >
          {t.print}
        </button>
      </div>
    </div>
  );
}
