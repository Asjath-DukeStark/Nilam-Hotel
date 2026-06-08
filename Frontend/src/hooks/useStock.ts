import { useState, useEffect, useCallback } from 'react';
import { SHORTIES_ITEMS } from '../constants';

export interface StockInfo {
  frozenQty: number;
  friedQty: number;
}

export type StockData = Record<string, StockInfo>;

export interface StockLog {
  id: string;
  timestamp: string;
  itemId: string;
  itemName: string;
  action: 'UPDATE_FROZEN' | 'UPDATE_FRIED' | 'TRANSFER' | 'SALE' | 'CANCEL_REPLENISH' | 'DAMAGE_DEDUCTION' | 'FREE_DEDUCTION';
  qty: number;
  prevFrozen: number;
  newFrozen: number;
  prevFried: number;
  newFried: number;
}

const STORAGE_KEY = 'shorties_stock';
const LOGS_STORAGE_KEY = 'shorties_stock_history';

// Helper to get item name dynamically
const getItemName = (itemId: string): string => {
  try {
    const saved = localStorage.getItem('shorties_items_list');
    if (saved) {
      const items = JSON.parse(saved);
      const matched = items.find((i: any) => i.id === itemId);
      if (matched) {
        return matched.nameEn || matched.id;
      }
    }
  } catch (e) {
    console.error(e);
  }
  
  const matchedConst = SHORTIES_ITEMS.find(i => i.id === itemId);
  if (matchedConst) {
    return matchedConst.nameEn || matchedConst.id;
  }
  return itemId;
};

export function useStock() {
  const [stockData, setStockData] = useState<StockData>({});
  const [logs, setLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize stock data ONCE on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStockData(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse stock data', e);
      }
    }
    
    // Default initial stock structure
    const initial: StockData = {};
    SHORTIES_ITEMS.forEach(obj => {
      initial[obj.id] = { frozenQty: 0, friedQty: 0 };
    });
    setStockData(initial);
  }, []);

  // Save stock data to localStorage
  useEffect(() => {
    if (Object.keys(stockData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stockData));
    }
  }, [stockData]);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const updateFrozen = useCallback((itemId: string, newFrozen: number) => {
    let logEntry: StockLog | null = null;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      const prevInfo = next[itemId];
      const finalFrozen = Math.max(0, newFrozen);
      next[itemId] = { ...next[itemId], frozenQty: finalFrozen };
      
      logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        itemId,
        itemName: getItemName(itemId),
        action: 'UPDATE_FROZEN',
        qty: Math.abs(finalFrozen - prevInfo.frozenQty),
        prevFrozen: prevInfo.frozenQty,
        newFrozen: finalFrozen,
        prevFried: prevInfo.friedQty,
        newFried: prevInfo.friedQty,
      };
      return next;
    });

    if (logEntry) {
      setLogs(prev => [logEntry!, ...prev]);
    }
  }, []);

  const updateFried = useCallback((itemId: string, newFried: number, reason: 'correct' | 'damage' | 'free' = 'correct') => {
    let logEntry: StockLog | null = null;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      const prevInfo = next[itemId];
      const finalFried = Math.max(0, newFried);
      next[itemId] = { ...next[itemId], friedQty: finalFried };
      
      const actionMap: Record<typeof reason, StockLog['action']> = {
        correct: 'UPDATE_FRIED',
        damage: 'DAMAGE_DEDUCTION',
        free: 'FREE_DEDUCTION',
      };
      
      logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        itemId,
        itemName: getItemName(itemId),
        action: actionMap[reason] || 'UPDATE_FRIED',
        qty: Math.abs(finalFried - prevInfo.friedQty),
        prevFrozen: prevInfo.frozenQty,
        newFrozen: prevInfo.frozenQty,
        prevFried: prevInfo.friedQty,
        newFried: finalFried,
      };
      return next;
    });

    if (logEntry) {
      setLogs(prev => [logEntry!, ...prev]);
    }
  }, []);

  const transferStock = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) return false;
    
    let success = false;
    let logEntry: StockLog | null = null;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      
      const prevInfo = next[itemId];
      if (qty <= prevInfo.frozenQty) {
        const newFrozen = prevInfo.frozenQty - qty;
        const newFried = prevInfo.friedQty + qty;
        next[itemId] = {
          frozenQty: newFrozen,
          friedQty: newFried,
        };
        success = true;
        
        logEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          itemId,
          itemName: getItemName(itemId),
          action: 'TRANSFER',
          qty,
          prevFrozen: prevInfo.frozenQty,
          newFrozen,
          prevFried: prevInfo.friedQty,
          newFried,
        };
      }
      return success ? next : prev;
    });

    if (success && logEntry) {
      setLogs(prev => [logEntry!, ...prev]);
    }
    return success;
  }, []);

  const deductSold = useCallback((itemId: string, qty: number) => {
    let logEntry: StockLog | null = null;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      const prevInfo = next[itemId];
      const newFried = Math.max(0, prevInfo.friedQty - qty);
      next[itemId] = {
        ...prevInfo,
        friedQty: newFried
      };
      
      logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        itemId,
        itemName: getItemName(itemId),
        action: 'SALE',
        qty,
        prevFrozen: prevInfo.frozenQty,
        newFrozen: prevInfo.frozenQty,
        prevFried: prevInfo.friedQty,
        newFried,
      };
      return next;
    });

    if (logEntry) {
      setLogs(prev => [logEntry!, ...prev]);
    }
  }, []);

  const replenishStock = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) return;
    let logEntry: StockLog | null = null;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      const prevInfo = next[itemId];
      const newFried = prevInfo.friedQty + qty;
      next[itemId] = {
        ...prevInfo,
        friedQty: newFried
      };
      
      logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        itemId,
        itemName: getItemName(itemId),
        action: 'CANCEL_REPLENISH',
        qty,
        prevFrozen: prevInfo.frozenQty,
        newFrozen: prevInfo.frozenQty,
        prevFried: prevInfo.friedQty,
        newFried,
      };
      return next;
    });

    if (logEntry) {
      setLogs(prev => [logEntry!, ...prev]);
    }
  }, []);

  const removeStock = useCallback((itemId: string) => {
    setStockData(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Helpers to get flags
  const anyLowStock = Object.values(stockData).some((item: any) => item.friedQty > 0 && item.friedQty <= 5);
  const anyOutOfStock = Object.values(stockData).some((item: any) => item.friedQty === 0);

  return {
    stockData,
    updateFrozen,
    updateFried,
    transferStock,
    deductSold,
    replenishStock,
    removeStock,
    anyLowStock,
    anyOutOfStock,
    logs,
    clearLogs
  };
}
