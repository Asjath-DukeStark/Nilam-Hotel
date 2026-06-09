import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, User, Phone, Pencil, Trash2, Calendar, ShoppingBag, DollarSign, Plus, X } from 'lucide-react';
import { Language, translations } from '../translations';
import { Customer } from '../types';

interface CustomerSectionProps {
  language: Language;
  onBack: () => void;
  onViewInvoice: (invoice: any) => void;
}

export function CustomerSection({ language, onBack, onViewInvoice }: CustomerSectionProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'add' | 'edit'>('add');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState('');

  // Load customers on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customers');
      if (saved) {
        setCustomers(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load customers', e);
    }
  }, []);

  // Save customers helper
  const saveCustomersList = (list: Customer[]) => {
    setCustomers(list);
    localStorage.setItem('customers', JSON.stringify(list));
  };

  // Load invoices to calculate stats and view history
  const invoices = (() => {
    try {
      const saved = localStorage.getItem('invoices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })();

  // Filter customers list
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return c.name.toLowerCase().includes(query) || c.phone.includes(query);
  });

  const selectedCustomer = customers.find(c => c.phone === selectedPhone);

  // Calculate stats for selected customer
  const customerInvoices = selectedPhone 
    ? invoices.filter((inv: any) => inv.phone === selectedPhone) 
    : [];

  const totalOrders = customerInvoices.length;
  const totalSpent = customerInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Handle direct add/edit
  const handleOpenAdd = () => {
    setFormType('add');
    setFormName('');
    setFormPhone('');
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormType('edit');
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (phone: string) => {
    const confirmMsg = t.deleteCustomerConfirm || 'Are you sure you want to delete this customer?';
    if (window.confirm(confirmMsg)) {
      const updated = customers.filter(c => c.phone !== phone);
      saveCustomersList(updated);
      if (selectedPhone === phone) {
        setSelectedPhone(null);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formName.trim();
    const cleanPhone = formPhone.trim().replace(/[^0-9]/g, '');

    if (!cleanName || !cleanPhone) {
      setFormError(language === 'ta' ? 'அனைத்து விவரங்களையும் பூர்த்தி செய்க' : 'Please fill all required fields');
      return;
    }

    if (formType === 'add') {
      const exists = customers.some(c => c.phone === cleanPhone);
      if (exists) {
        setFormError(t.phoneExists || 'A customer with this phone number already exists');
        return;
      }

      const newCustomer: Customer = {
        name: cleanName,
        phone: cleanPhone,
        createdAt: new Date().toISOString(),
      };
      saveCustomersList([...customers, newCustomer]);
      setSelectedPhone(cleanPhone);
    } else {
      // Edit mode: if phone number changed, make sure new phone doesn't conflict
      if (cleanPhone !== selectedPhone) {
        const exists = customers.some(c => c.phone === cleanPhone);
        if (exists) {
          setFormError(t.phoneExists || 'A customer with this phone number already exists');
          return;
        }
      }

      const updated = customers.map(c => {
        if (c.phone === selectedPhone) {
          return { ...c, name: cleanName, phone: cleanPhone };
        }
        return c;
      });

      // Update phone inside all invoices as well so history is preserved
      if (cleanPhone !== selectedPhone) {
        try {
          const savedInvoices = localStorage.getItem('invoices');
          if (savedInvoices) {
            const list = JSON.parse(savedInvoices);
            const nextList = list.map((inv: any) => {
              if (inv.phone === selectedPhone) {
                return { ...inv, phone: cleanPhone, customerName: cleanName };
              }
              return inv;
            });
            localStorage.setItem('invoices', JSON.stringify(nextList));
          }
        } catch (e) {
          console.error(e);
        }
      }

      saveCustomersList(updated);
      setSelectedPhone(cleanPhone);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="h-[52px] border-t-[3px] border-amber-500 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center justify-center min-w-[36px] min-h-[36px] bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 outline-none"
          >
            <ArrowLeft className="w-5 h-5 text-brand-charcoal" />
          </button>
          <span className="font-heading font-bold text-base text-brand-charcoal">
            {t.customers}
          </span>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-heading font-bold text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm outline-none"
        >
          <Plus className="w-4 h-4" />
          {t.addCustomer || 'Add Customer'}
        </button>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Search & Customers List */}
        <div className="w-full md:w-[380px] bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
          {/* Search bar inside sidebar */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex bg-gray-100 rounded-xl px-3 py-2 items-center border border-gray-200 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchCustomers || 'Search Customers...'}
                className="bg-transparent outline-none text-xs w-full text-brand-charcoal font-medium"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 scrollable p-3 space-y-1.5 no-scrollbar">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm font-medium">
                {t.noCustomers || 'No customers found'}
              </div>
            ) : (
              filteredCustomers.map(c => {
                const isSelected = selectedPhone === c.phone;
                return (
                  <button
                    key={c.phone}
                    onClick={() => setSelectedPhone(isSelected ? null : c.phone)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left outline-none transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-50 border-amber-300 text-brand-charcoal'
                        : 'bg-white hover:bg-gray-50 border-gray-100 text-brand-charcoal shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                        isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.name.slice(0, 2)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-heading font-bold text-sm leading-snug">{c.name}</span>
                        <span className="text-[11px] text-gray-400 font-medium font-mono">{c.phone}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Profile Details & Order History Drawer */}
        <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
          {selectedCustomer ? (
            <div className="flex-1 flex flex-col overflow-hidden p-6 max-w-4xl w-full mx-auto space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl uppercase">
                    {selectedCustomer.name.slice(0, 2)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading font-black text-xl text-brand-charcoal leading-tight">
                      {selectedCustomer.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-xs font-semibold">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="flex-1 sm:flex-initial p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 border border-gray-200 font-bold text-xs outline-none"
                  >
                    <Pencil className="w-4 h-4" />
                    {language === 'ta' ? 'திருத்து' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(selectedCustomer.phone)}
                    className="flex-1 sm:flex-initial p-3 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 border border-red-200 font-bold text-xs outline-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    {language === 'ta' ? 'நீக்கு' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stat 1: Total Spent */}
                <div className="bg-white p-5 rounded-3xl shadow-2xs border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.totalSpent}</span>
                    <span className="font-heading font-black text-lg text-brand-charcoal mt-0.5">LKR {totalSpent.toFixed(2)}</span>
                  </div>
                </div>

                {/* Stat 2: Total Orders */}
                <div className="bg-white p-5 rounded-3xl shadow-2xs border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t.totalOrders}</span>
                    <span className="font-heading font-black text-lg text-brand-charcoal mt-0.5">
                      {totalOrders} {totalOrders === 1 ? (language === 'ta' ? 'வருகை' : 'visit') : (t.visits || 'visits')}
                    </span>
                  </div>
                </div>

                {/* Stat 3: Avg Order Value */}
                <div className="bg-white p-5 rounded-3xl shadow-2xs border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {language === 'ta' ? 'சராசரி மதிப்பு' : 'Avg Order Value'}
                    </span>
                    <span className="font-heading font-black text-lg text-brand-charcoal mt-0.5">LKR {avgOrderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order History Invoice List */}
              <div className="flex-1 bg-white rounded-3xl border border-gray-100 flex flex-col overflow-hidden shadow-2xs">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <h3 className="font-heading font-bold text-base text-brand-charcoal">
                    {language === 'ta' ? 'முந்தைய கொள்முதல் இன்வாய்ஸ்கள்' : 'Purchase History'}
                  </h3>
                </div>
                
                <div className="flex-1 scrollable p-4 space-y-2.5">
                  {customerInvoices.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-8 text-gray-400 text-sm font-medium">
                      {language === 'ta' ? 'இன்வாய்ஸ்கள் எதுவும் இல்லை' : 'No invoices found for this customer'}
                    </div>
                  ) : (
                    customerInvoices.reverse().map((inv: any, idx: number) => {
                      const [yyyy, mm, dd] = (inv.date || '').split('-');
                      const formattedDate = yyyy ? `${dd}/${mm}/${yyyy}` : inv.date;
                      const isPaid = inv.payStatus === 'paid';
                      
                      return (
                        <button
                          key={`${inv.invoiceNo}-${idx}`}
                          onClick={() => onViewInvoice(inv)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-amber-50/20 rounded-2xl border border-gray-150 active:scale-[0.99] transition-all text-left outline-none"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-xs text-brand-charcoal font-heading">{inv.invoiceNo}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{formattedDate} {inv.time}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs text-brand-charcoal font-heading">
                              LKR {inv.total.toFixed(2)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-heading uppercase tracking-wide border ${
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
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
              <span className="text-5xl mb-3">👥</span>
              <span className="font-medium text-lg">
                {language === 'ta' ? 'விவரங்களைப் பார்க்க வாடிக்கையாளரைத் தேர்வு செய்யவும்' : 'Select a customer to view history & stats'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal Popup */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50">
          <form 
            onSubmit={handleFormSubmit}
            className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 border border-gray-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <h3 className="text-base font-heading font-black text-brand-charcoal">
                {formType === 'add' 
                  ? (t.addCustomer || 'Add Customer') 
                  : (t.editCustomer || 'Edit Customer')}
              </h3>
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-brand-charcoal transition-colors outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="bg-red-50 border border-red-200 text-red-650 text-xs px-3 py-2 rounded-xl font-semibold text-center">
                {formError}
              </p>
            )}

            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500">
                  {language === 'ta' ? 'பெயர் *' : 'Name *'}
                </span>
                <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden items-center focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="flex-1 py-2.5 px-3 bg-transparent outline-none font-heading font-bold text-brand-charcoal text-sm w-full"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-500">
                  {language === 'ta' ? 'தொலைபேசி எண் *' : 'Phone Number *'}
                </span>
                <div className="flex bg-gray-50 rounded-xl border border-gray-200 overflow-hidden items-center focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary focus-within:bg-white transition-all">
                  <Phone className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 0771234567"
                    className="flex-1 py-2.5 px-3 bg-transparent outline-none font-heading font-bold text-brand-charcoal text-sm w-full font-mono"
                  />
                </div>
              </label>
            </div>

            <div className="flex gap-2.5 w-full mt-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 font-heading font-bold text-xs rounded-xl transition-all outline-none"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-brand-primary hover:bg-amber-700 active:scale-95 text-white font-heading font-bold text-xs rounded-xl transition-all shadow-md outline-none"
              >
                {t.saveProfile || 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
