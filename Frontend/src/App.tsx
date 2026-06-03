import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Settings, Package2 } from 'lucide-react';
import { ModeSelector } from './components/ModeSelector';
import { CategoryBar } from './components/CategoryBar';
import { OrderPanel } from './components/OrderPanel';
import { ItemBuilder } from './components/ItemBuilder';
import { DhosaiBuilder } from './components/DhosaiBuilder';
import { FixedItemBuilder } from './components/FixedItemBuilder';
import { BillModal } from './components/BillModal';
import { SettingsModal } from './components/SettingsModal';
import { StockManager } from './components/StockManager';
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
  const [currentPage, setCurrentPage] = useState<'pos' | 'settings' | 'stock'>('pos');
  const [itemPrices, setItemPrices] = useLocalStorage<Record<string, number>>('itemPrices', {});
  const [restaurantName, setRestaurantName] = useLocalStorage<string>('restaurantName', RESTAURANT_NAME);

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('menu_prices');
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });

  useEffect(() => {
    localStorage.setItem('menu_prices', JSON.stringify(prices));
  }, [prices]);

  // Phase 6 states
  const [shortiesItems, setShortiesItems] = useLocalStorage<any[]>('shorties_items_list', SHORTIES_ITEMS);
  const [beverageItems, setBeverageItems] = useLocalStorage<any[]>('beverage_items', BEVERAGE_ITEMS);
  const [hotItems, setHotItems] = useLocalStorage<any[]>('hot_items', HOT_ITEMS);
  const stock = useStock();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  const handleAddItem = (item: BillItem) => {
    // If it's a shorties item, we should deduct stock here
    if (item.id.startsWith('shorties_')) { // wait, item.id is unique per bill item? Let's assume item has itemId or something.
      // Wait, how do we know if it's shorties? `item.categoryId` or similar? Let's just deduct it in the FixedItemBuilder when it's added.
      // Actually we will handle stock deduction inside FixedItemBuilder immediately before calling onAdd.
    }
    setBillItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
    setBillItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearBill = () => {
    setBillItems([]);
  };

  const handleCompleteBill = () => {
    setShowBillModal(true);
  };

  const handleNewBill = () => {
    setShowBillModal(false);
    setBillItems([]);
    setSelectedCategory(null);
    setTableNumber('');
    setOrderType('dineIn');
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

    switch (selectedCategory) {
      case 'kottu':
      case 'dolphinKottu':
      case 'rice':
        return <ItemBuilder key={selectedCategory} category={selectedCategory} prices={prices} {...commonProps} />;
      case 'dhosai':
        return <DhosaiBuilder key="dhosai" prices={prices} {...commonProps} />;
      case 'shorties':
        return <FixedItemBuilder key="shorties" categoryId="shorties" items={shortiesItems} customPrices={itemPrices} stock={stock} {...commonProps} />;
      case 'beverage':
        return <FixedItemBuilder key="beverage" categoryId="beverage" items={beverageItems} customPrices={itemPrices} {...commonProps} />;
      case 'hot':
        return <FixedItemBuilder key="hot" categoryId="hot" items={hotItems} customPrices={itemPrices} {...commonProps} />;
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
              {showBillModal ? (
                <BillModal 
                  key="bill-modal"
                  language={language}
                  items={billItems}
                  mode={mode}
                  orderType={orderType}
                  tableNumber={tableNumber}
                  restaurantName={restaurantName}
                  onNewBill={handleNewBill}
                />
              ) : !mode ? (
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
                            setMode(null);
                            setSelectedCategory(null);
                            setBillItems([]);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors min-h-[48px] active:scale-95 group"
                        >
                          <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-brand-charcoal transition-colors" />
                          <span className="font-heading font-semibold text-brand-charcoal text-sm tracking-wide">
                            {mode === 'DINE_IN' ? t.dineIn : t.takeaway}
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
              onOpenStockManager={() => setCurrentPage('stock')}
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
      </AnimatePresence>
    </div>
  );
}

