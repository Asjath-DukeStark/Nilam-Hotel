import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { Language, translations } from '../translations';

interface InvoiceHistoryProps {
  language: Language;
  onBack: () => void;
  onViewInvoice: (invoice: any) => void;
}

export function InvoiceHistory({ language, onBack, onViewInvoice }: InvoiceHistoryProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = (() => {
    try {
      const saved = localStorage.getItem('invoices');
      const list = saved ? JSON.parse(saved) : [];
      // Sort newest first
      return [...list].reverse();
    } catch (e) {
      return [];
    }
  })();

  const filteredInvoices = invoices.filter((inv: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    // Match invoice number
    const matchNo = inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(query);
    
    // Match date: saved date format is YYYY-MM-DD
    // Formatted date is DD/MM/YYYY
    const [yyyy, mm, dd] = (inv.date || '').split('-');
    const formattedDate = yyyy ? `${dd}/${mm}/${yyyy}` : '';
    const matchDate = (inv.date && inv.date.includes(query)) || formattedDate.includes(query);
    
    return matchNo || matchDate;
  });

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-[52px] border-t-[3px] border-amber-500 bg-white border-b border-gray-200 px-6 flex items-center gap-4 shrink-0 shadow-xs z-10 sticky top-0">
        <button 
          onClick={onBack}
          className="flex items-center justify-center min-w-[36px] min-h-[36px] bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 outline-none"
        >
          <ArrowLeft className="w-5 h-5 text-brand-charcoal" />
        </button>
        <h1 className="font-heading font-bold text-base text-brand-charcoal">
          {language === 'ta' ? 'இன்வாய்ஸ் வரலாறு' : 'Invoice History'}
        </h1>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xs ml-auto flex bg-gray-100 rounded-full px-3 py-1.5 items-center border border-gray-200 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-white transition-all">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ta' ? 'தேடவும் (எண்/தேதி)...' : 'Search (No/Date)...'}
            className="bg-transparent outline-none text-xs w-full text-brand-charcoal font-medium"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex-1 overflow-y-auto p-4 max-w-xl mx-auto w-full">
        {filteredInvoices.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-gray-400">
            <span className="text-4xl mb-2">📄</span>
            <span className="font-medium text-sm">
              {language === 'ta' ? 'இன்வாய்ஸ்கள் எதுவும் இல்லை' : 'No invoices found'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredInvoices.map((inv: any, idx: number) => {
              const [yyyy, mm, dd] = (inv.date || '').split('-');
              const formattedDate = yyyy ? `${dd}/${mm}/${yyyy}` : inv.date;
              
              const isPaid = inv.payStatus === 'paid';
              
              return (
                <button
                  key={`${inv.invoiceNo}-${idx}`}
                  onClick={() => onViewInvoice(inv)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-amber-50/20 rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] active:scale-[0.99] transition-all text-left outline-none"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-brand-charcoal font-heading">{inv.invoiceNo}</span>
                    <span className="text-[11px] text-gray-400 font-semibold">{formattedDate} {inv.time}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-sm text-brand-charcoal font-heading">
                      LKR {inv.total.toFixed(2)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-heading uppercase tracking-wide border ${
                      isPaid 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      {isPaid 
                        ? (language === 'ta' ? 'செலுத்தப்பட்டது' : 'PAID') 
                        : (language === 'ta' ? 'செலுத்த' : 'PAY')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
