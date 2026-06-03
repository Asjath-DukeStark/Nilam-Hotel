import React from 'react';

interface StockBadgeProps {
  qty: number;
  label?: string;
}

export function StockBadge({ qty, label }: StockBadgeProps) {
  if (qty === 0) {
    return (
      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-20">
        {label || "Out of Stock"}
      </div>
    );
  }
  
  if (qty <= 5) {
    return (
      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-20 flex items-center gap-1">
        <span>{qty} {label || "pcs"}</span>
        <span className="text-[10px]">⚠</span>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-20">
      {qty} {label || "pcs"}
    </div>
  );
}
