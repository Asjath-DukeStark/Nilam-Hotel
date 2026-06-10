import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Settings, Package2, Receipt, Users } from 'lucide-react';
import { InvoiceHistory } from './components/InvoiceHistory';
import { ModeSelector } from './components/ModeSelector';
import { CategoryBar } from './components/CategoryBar';
import { OrderPanel } from './components/OrderPanel';
import { ItemBuilder } from './components/ItemBuilder';
import { DhosaiBuilder } from './components/DhosaiBuilder';
import { MealsBuilder } from './components/MealsBuilder';
import { GravyBuilder } from './components/GravyBuilder';
import { FixedItemBuilder } from './components/FixedItemBuilder';
import { BillModal } from './components/BillModal';
import { SettingsModal } from './components/SettingsModal';
import { StockManager } from './components/StockManager';
import { CustomerSection } from './components/CustomerSection';
import { Language, translations } from './translations';
import { BillItem } from './types';
import { SHORTIES_ITEMS, BEVERAGE_ITEMS, HOT_ITEMS, RESTAURANT_NAME, DEFAULT_PRICES } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useStock } from './hooks/useStock';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<'DINE_IN' | 'TAKEAWAY' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  // Phase 4 states
  const [showBillModal, setShowBillModal] = useState(false);
  const [orderType, setOrderType] = useState<'takeaway' | 'dineIn' | 'both'>('dineIn');
  const [tableNumber, setTableNumber] = useState('');

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'pos' | 'settings' | 'stock' | 'invoices' | 'customers'>('pos');
  const [isCheckoutMode, setIsCheckoutMode] = useState<boolean>(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [editingInvoiceNo, setEditingInvoiceNo] = useState<string | null>(null);
  const [itemPrices, setItemPrices] = useLocalStorage<Record<string, number>>('itemPrices', {});
  const [restaurantName, setRestaurantName] = useLocalStorage<string>('restaurantName', RESTAURANT_NAME);

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('menu_prices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PRICES, ...parsed };
      } catch (e) {
        console.error('Failed to parse menu_prices', e);
      }
    }
    return DEFAULT_PRICES;
  });

  useEffect(() => {
    localStorage.setItem('menu_prices', JSON.stringify(prices));
  }, [prices]);

  const [extraPrices, setExtraPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('extra_prices');
    return saved ? JSON.parse(saved) : {
      extraChicken: 100,
      extraBeef: 120,
      extraEgg: 50
    };
  });

  useEffect(() => {
    localStorage.setItem('extra_prices', JSON.stringify(extraPrices));
  }, [extraPrices]);

  // Phase 6 states
  const [shortiesItems, setShortiesItems] = useLocalStorage<any[]>('shorties_items_list', SHORTIES_ITEMS);
  const [beverageItems, setBeverageItems] = useLocalStorage<any[]>('beverage_items', BEVERAGE_ITEMS);
  const [hotItems, setHotItems] = useLocalStorage<any[]>('hot_items', HOT_ITEMS);
  const stock = useStock();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  const handleAddItem = (item: BillItem) => {
    if (isCheckoutMode) {
      if (editingItemIndex !== null) {
        const oldItem = billItems[editingItemIndex];
        if (oldItem && oldItem.categoryId === 'shorties' && oldItem.baseType) {
          stock.replenishStock(oldItem.baseType, oldItem.qty || 1);
        }
        setBillItems(prev => {
          const next = [...prev];
          next[editingItemIndex] = { ...item, id: prev[editingItemIndex].id };
          return next;
        });
        setEditingItemIndex(null);
      } else {
        setBillItems(prev => [...prev, item]);
      }
      setShowBillModal(true);
    } else {
      setBillItems(prev => [...prev, item]);
    }
  };

  const handleRemoveItem = (id: string) => {
    const item = billItems.find(x => x.id === id);
    if (item && item.categoryId === 'shorties' && item.baseType) {
      stock.replenishStock(item.baseType, item.qty || 1);
    }
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearBill = () => {
    billItems.forEach(item => {
      if (item.categoryId === 'shorties' && item.baseType) {
        stock.replenishStock(item.baseType, item.qty || 1);
      }
    });
    setBillItems([]);
  };

  const handleCompleteBill = () => {
    setIsCheckoutMode(true);
    setShowBillModal(true);
  };

  const handleNewBill = () => {
    setShowBillModal(false);
    setBillItems([]);
    setSelectedCategory(null);
    setTableNumber('');
    setOrderType('dineIn');
    setIsCheckoutMode(false);
    setEditingItemIndex(null);
  };

  const handleSaveInvoice = (payStatus: 'pay' | 'paid', phone: string, customerName: string, printLanguage: 'en' | 'ta', invoiceNo: string) => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const dateStr = `${YYYY}-${MM}-${DD}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const isEditingExisting = editingInvoiceNo !== null;
    const finalInvoiceNo = isEditingExisting ? editingInvoiceNo : invoiceNo;

    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');

    // Save customer profile automatically
    if (phone.trim()) {
      try {
        const savedCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
        const cleanPhone = phone.trim();
        const cleanName = customerName.trim() || cleanPhone;
        const existingIdx = savedCustomers.findIndex((c: any) => c.phone === cleanPhone);
        if (existingIdx >= 0) {
          if (customerName.trim()) {
            savedCustomers[existingIdx].name = cleanName;
          }
        } else {
          savedCustomers.push({
            phone: cleanPhone,
            name: cleanName,
            createdAt: new Date().toISOString()
          });
        }
        localStorage.setItem('customers', JSON.stringify(savedCustomers));
      } catch (e) {
        console.error('Failed to save customer during checkout', e);
      }
    }
    
    let updatedInvoices;
    if (isEditingExisting) {
      updatedInvoices = savedInvoices.map((inv: any) => {
        if (inv.invoiceNo === finalInvoiceNo) {
          return {
            ...inv,
            mode: mode === 'DINE_IN' ? 'dine-in' : 'takeaway',
            orderType: orderType,
            tableNo: tableNumber,
            phone: phone.trim(),
            customerName: customerName.trim(),
            items: [...billItems],
            total: billItems.reduce((sum, item) => sum + item.price, 0),
            payStatus,
            language: printLanguage
          };
        }
        return inv;
      });
    } else {
      const newInvoice = {
        invoiceNo: finalInvoiceNo,
        date: dateStr,
        time: timeStr,
        mode: mode === 'DINE_IN' ? 'dine-in' : 'takeaway',
        orderType: orderType,
        tableNo: tableNumber,
        phone: phone.trim(),
        customerName: customerName.trim(),
        items: [...billItems],
        total: billItems.reduce((sum, item) => sum + item.price, 0),
        payStatus,
        language: printLanguage
      };
      savedInvoices.push(newInvoice);
      updatedInvoices = savedInvoices;
    }

    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    setBillItems([]);
    setShowBillModal(false);
    setSelectedCategory(null);
    setTableNumber('');
    setOrderType('dineIn');
    setIsCheckoutMode(false);
    setEditingItemIndex(null);
    setEditingInvoiceNo(null);
  };

  const handleUpdatePayStatus = (invoiceNo: string, newStatus: 'pay' | 'paid') => {
    setViewingInvoice(prev => {
      if (prev && prev.invoiceNo === invoiceNo) {
        return { ...prev, payStatus: newStatus };
      }
      return prev;
    });

    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const nextInvoices = savedInvoices.map((inv: any) => {
      if (inv.invoiceNo === invoiceNo) {
        return { ...inv, payStatus: newStatus };
      }
      return inv;
    });
    localStorage.setItem('invoices', JSON.stringify(nextInvoices));
  };

  const handleUpdatePhone = (invoiceNo: string, newPhone: string) => {
    setViewingInvoice(prev => {
      if (prev && prev.invoiceNo === invoiceNo) {
        return { ...prev, phone: newPhone };
      }
      return prev;
    });

    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const nextInvoices = savedInvoices.map((inv: any) => {
      if (inv.invoiceNo === invoiceNo) {
        return { ...inv, phone: newPhone };
      }
      return inv;
    });
    localStorage.setItem('invoices', JSON.stringify(nextInvoices));
  };

  const handleUpdateCustomerName = (invoiceNo: string, newName: string) => {
    setViewingInvoice(prev => {
      if (prev && prev.invoiceNo === invoiceNo) {
        return { ...prev, customerName: newName };
      }
      return prev;
    });

    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const nextInvoices = savedInvoices.map((inv: any) => {
      if (inv.invoiceNo === invoiceNo) {
        return { ...inv, customerName: newName };
      }
      return inv;
    });
    localStorage.setItem('invoices', JSON.stringify(nextInvoices));
  };

  const handleEditHistoricalInvoice = (invoice: any) => {
    setEditingInvoiceNo(invoice.invoiceNo);
    setBillItems(invoice.items);
    setMode(invoice.mode === 'dine-in' ? 'DINE_IN' : 'TAKEAWAY');
    setOrderType(invoice.orderType);
    setTableNumber(invoice.tableNo);
    setIsCheckoutMode(true);
    setViewingInvoice(null);
    setShowBillModal(true);
  };

  const t = translations[language];

  const renderBuilder = () => {
    const commonProps = {
      language,
      onAdd: handleAddItem,
      onComplete: (item: BillItem) => {
        handleAddItem(item);
        handleCompleteBill();
      }
    };

    const editingItem = editingItemIndex !== null ? billItems[editingItemIndex] : undefined;

    switch (selectedCategory) {
      case 'kottu':
      case 'dolphinKottu':
      case 'rice':
        return (
          <ItemBuilder 
            key={selectedCategory} 
            category={selectedCategory} 
            prices={prices} 
            extraPrices={extraPrices}
            initialItem={editingItem}
            {...commonProps} 
          />
        );
      case 'dhosai':
        return <DhosaiBuilder key="dhosai" prices={prices} initialItem={editingItem} {...commonProps} />;
      case 'meals':
        return <MealsBuilder key="meals" prices={prices} initialItem={editingItem} {...commonProps} />;
      case 'gravy':
        return <GravyBuilder key="gravy" prices={prices} initialItem={editingItem} {...commonProps} />;
      case 'shorties':
        return <FixedItemBuilder key="shorties" categoryId="shorties" items={shortiesItems} customPrices={itemPrices} stock={stock} initialItem={editingItem} {...commonProps} />;
      case 'beverage':
        return <FixedItemBuilder key="beverage" categoryId="beverage" items={beverageItems} customPrices={itemPrices} initialItem={editingItem} {...commonProps} />;
      case 'hot':
        return <FixedItemBuilder key="hot" categoryId="hot" items={hotItems} customPrices={itemPrices} initialItem={editingItem} {...commonProps} />;
      default:
        return (
          <>
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 flex items-center justify-center mb-6 shadow-sm overflow-hidden">
              <span className="text-gray-400 font-medium text-xl font-heading">{t.selectCategory}</span>
            </div>
            <div className="shrink-0 h-48 bg-white/50 border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center">
              <span className="text-gray-400 font-medium text-lg">{t.numpadPlaceholder}</span>
            </div>
          </>
        );
    }
  };

  return (
    <div className="w-screen h-dvh overflow-hidden bg-gray-100 text-brand-charcoal font-sans relative">
      <AnimatePresence mode="popLayout">
        {currentPage === 'pos' && (
          <motion.div
            key="pos-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <AnimatePresence mode="wait">
              {showBillModal ? (() => {
                const editingInvoice = editingInvoiceNo 
                  ? JSON.parse(localStorage.getItem('invoices') || '[]').find((inv: any) => inv.invoiceNo === editingInvoiceNo) 
                  : null;
                return (
                  <BillModal 
                    key="checkout-bill"
                    language={language}
                    items={billItems}
                    mode={mode}
                    orderType={orderType}
                    tableNumber={tableNumber}
                    phone={editingInvoice?.phone}
                    customerName={editingInvoice?.customerName}
                    restaurantName={restaurantName}
                    onNewBill={handleNewBill}
                    extraPrices={extraPrices}
                    isViewOnly={false}
                    invoiceNo={editingInvoiceNo || undefined}
                    onEditItem={(idx) => {
                      setEditingItemIndex(idx);
                      const item = billItems[idx];
                      setSelectedCategory(item.categoryId);
                      setShowBillModal(false);
                    }}
                    onDeleteItem={(idx) => {
                      const item = billItems[idx];
                      if (item && item.categoryId === 'shorties' && item.baseType) {
                        stock.replenishStock(item.baseType, item.qty || 1);
                      }
                      setBillItems(prev => prev.filter((_, i) => i !== idx));
                    }}
                    onAddMoreItems={() => {
                      setEditingItemIndex(null);
                      setSelectedCategory(null);
                      setShowBillModal(false);
                    }}
                    onSaveInvoice={handleSaveInvoice}
                    onCancelCheckout={() => {
                      setShowBillModal(false);
                      setIsCheckoutMode(false);
                      setEditingItemIndex(null);
                    }}
                  />
                );
              })() : !mode ? (
                <ModeSelector 
                  key="mode-selector" 
                  onSelectMode={setMode} 
                  language={language}
                  onToggleLanguage={toggleLanguage}
                />
              ) : (
                <motion.div 
                  key="main-app"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="main-layout w-full h-full"
                >
                  {/* Left Panel */}
                  <div className="left-panel bg-gray-50/50">
                    {/* Top Bar */}
                    <div className="h-[48px] bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={() => {
                            if (isCheckoutMode) {
                              setShowBillModal(true);
                            } else {
                              billItems.forEach(item => {
                                if (item.categoryId === 'shorties' && item.baseType) {
                                  stock.replenishStock(item.baseType, item.qty || 1);
                                }
                              });
                              setMode(null);
                              setSelectedCategory(null);
                              setBillItems([]);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors min-h-[48px] active:scale-95 group"
                        >
                          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-brand-charcoal transition-colors" />
                          <span className="font-heading font-semibold text-brand-charcoal text-sm tracking-wide">
                            {isCheckoutMode 
                              ? (language === 'ta' ? 'பில்லுக்குத் திரும்பு' : 'Return to Bill')
                              : (mode === 'DINE_IN' ? t.dineIn : t.takeaway)}
                          </span>
                        </button>
                      </div>
                      
                      <div className="flex gap-4 items-center">
                        <button 
                          onClick={toggleLanguage}
                          className="hidden md:block px-6 py-2 bg-brand-charcoal text-white rounded-full font-heading font-semibold hover:bg-black transition-colors min-h-[48px] active:scale-95"
                        >
                          {language === 'en' ? 'தமிழ்' : 'EN'}
                        </button>
                        <button
                          onClick={() => setCurrentPage('stock')}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 text-gray-600 relative ml-2"
                        >
                          <Package2 className="w-5 h-5" />
                          {stock.anyOutOfStock ? (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                          ) : stock.anyLowStock ? (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
                          ) : null}
                        </button>
                        <button
                          onClick={() => setCurrentPage('invoices')}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 text-gray-600 ml-2"
                          title="Invoice History"
                        >
                          <Receipt className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentPage('customers')}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 text-gray-600 ml-2"
                          title={t.customers}
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setCurrentPage('settings')}
                          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors active:scale-95 text-gray-600 ml-2"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col flex-1 p-6 overflow-hidden relative">
                      {/* Category Bar (Top) */}
                      <div className="shrink-0 mb-6">
                        <CategoryBar 
                          language={language} 
                          selectedCategory={selectedCategory}
                          onSelectCategory={setSelectedCategory}
                        />
                      </div>

                      {/* Option Area (Middle) and Numpad (Bottom) */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedCategory || 'empty'}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 flex flex-col overflow-hidden"
                        >
                          {renderBuilder()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Panel - 40% */}
                  <OrderPanel 
                    language={language} 
                    items={billItems}
                    mode={mode}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    tableNumber={tableNumber}
                    setTableNumber={setTableNumber}
                    onRemoveItem={handleRemoveItem}
                    onClearBill={handleClearBill}
                    onCompleteBill={handleCompleteBill}
                    extraPrices={extraPrices}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {currentPage === 'settings' && (
          <motion.div
            key="settings-page"
            initial={{ x: '100vw' }}
            animate={{ x: 0 }}
            exit={{ x: '100vw' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full fixed inset-0 z-50 bg-white"
          >
            <SettingsModal 
              language={language}
              onBack={() => setCurrentPage('pos')}
              restaurantName={restaurantName}
              setRestaurantName={setRestaurantName}
              itemPrices={itemPrices}
              setItemPrices={setItemPrices}
              onToggleLanguage={toggleLanguage}
              prices={prices}
              setPrices={setPrices}
              beverageItems={beverageItems}
              setBeverageItems={setBeverageItems}
              hotItems={hotItems}
              setHotItems={setHotItems}
              shortiesItems={shortiesItems}
              setShortiesItems={setShortiesItems}
              onOpenStockManager={() => setCurrentPage('stock')}
              extraPrices={extraPrices}
              setExtraPrices={setExtraPrices}
            />
          </motion.div>
        )}

        {currentPage === 'stock' && (
          <motion.div
            key="stock-page"
            initial={{ x: '100vw' }}
            animate={{ x: 0 }}
            exit={{ x: '100vw' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full fixed inset-0 z-50 bg-gray-50"
          >
            <StockManager 
              language={language}
              onBack={() => setCurrentPage('pos')}
              stock={stock}
              items={shortiesItems}
              setItems={setShortiesItems}
            />
          </motion.div>
        )}

        {currentPage === 'invoices' && (
          <motion.div
            key="invoices-page"
            initial={{ x: '100vw' }}
            animate={{ x: 0 }}
            exit={{ x: '100vw' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full fixed inset-0 z-50 bg-gray-50"
          >
            <InvoiceHistory 
              language={language}
              onBack={() => setCurrentPage('pos')}
              onViewInvoice={(invoice) => {
                setViewingInvoice(invoice);
              }}
            />
          </motion.div>
        )}

        {currentPage === 'customers' && (
          <motion.div
            key="customers-page"
            initial={{ x: '100vw' }}
            animate={{ x: 0 }}
            exit={{ x: '100vw' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full h-full fixed inset-0 z-50 bg-gray-50"
          >
            <CustomerSection 
              language={language}
              onBack={() => setCurrentPage('pos')}
              onViewInvoice={(invoice) => {
                setViewingInvoice(invoice);
              }}
            />
          </motion.div>
        )}

        {viewingInvoice && (
          <motion.div
            key="viewing-invoice-modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full fixed inset-0 z-50 bg-white"
          >
            <BillModal 
              language={viewingInvoice.language}
              items={viewingInvoice.items}
              mode={viewingInvoice.mode === 'dine-in' ? 'DINE_IN' : 'TAKEAWAY'}
              orderType={viewingInvoice.orderType}
              tableNumber={viewingInvoice.tableNo}
              phone={viewingInvoice.phone}
              customerName={viewingInvoice.customerName}
              restaurantName={restaurantName}
              onNewBill={handleNewBill}
              extraPrices={extraPrices}
              isViewOnly={true}
              invoiceNo={viewingInvoice.invoiceNo}
              payStatus={viewingInvoice.payStatus}
              date={viewingInvoice.date}
              time={viewingInvoice.time}
              onCloseViewOnly={() => setViewingInvoice(null)}
              onUpdatePayStatus={handleUpdatePayStatus}
              onUpdatePhone={handleUpdatePhone}
              onUpdateCustomerName={handleUpdateCustomerName}
              onEditHistoricalInvoice={() => handleEditHistoricalInvoice(viewingInvoice)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

