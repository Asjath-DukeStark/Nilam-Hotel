import { useState, useEffect, useCallback } from 'react';
import { SHORTIES_ITEMS } from '../constants';

export interface StockInfo {
  frozenQty: number;
  friedQty: number;
}

export type StockData = Record<string, StockInfo>;

const STORAGE_KEY = 'shorties_stock';

export function useStock() {
  const [stockData, setStockData] = useState<StockData>({});

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

  // Save to localStorage in a SEPARATE useEffect that watches stockData
  useEffect(() => {
    if (Object.keys(stockData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stockData));
    }
  }, [stockData]);

  const updateFrozen = useCallback((itemId: string, newFrozen: number) => {
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      next[itemId] = { ...next[itemId], frozenQty: Math.max(0, newFrozen) };
      return next;
    });
  }, []);

  const updateFried = useCallback((itemId: string, newFried: number) => {
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      next[itemId] = { ...next[itemId], friedQty: Math.max(0, newFried) };
      return next;
    });
  }, []);

  const transferStock = useCallback((itemId: string, qty: number) => {
    if (qty <= 0) return false;
    
    let success = false;
    setStockData(prev => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = { frozenQty: 0, friedQty: 0 };
      
      const currentFrozen = next[itemId].frozenQty;
      if (qty <= currentFrozen) {
        next[itemId] = {
          frozenQty: currentFrozen - qty,
          friedQty: next[itemId].friedQty + qty,
        };
        success = true;
      }
      return success ? next : prev;
    });
    return success;
  }, []);

  const deductSold = useCallback((itemId: string, qty: number) => {
    setStockData(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        next[itemId] = {
          ...next[itemId],
          friedQty: Math.max(0, next[itemId].friedQty - qty)
        };
      }
      return next;
    });
  }, []);

  const removeStock = useCallback((itemId: string) => {
    setStockData(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
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
    removeStock,
    anyLowStock,
    anyOutOfStock
  };
}
