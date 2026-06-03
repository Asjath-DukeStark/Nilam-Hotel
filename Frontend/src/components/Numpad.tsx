import { Delete } from 'lucide-react';
import { Language, translations } from '../translations';

interface NumpadProps {
  value: string;
  onChange: (val: string) => void;
  mode: 'price' | 'qty';
  language: Language;
}

export function Numpad({ value, onChange, mode, language }: NumpadProps) {
  const t = translations[language];

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      onChange('');
    } else if (key === 'Backspace') {
      onChange(value.slice(0, -1));
    } else {
      if (value === '0') {
        onChange(key);
      } else {
        onChange(value + key);
      }
    }
  };

  const buttons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', 'Backspace'
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-white border border-gray-200 rounded-[8px] text-center shadow-inner flex items-center justify-center shrink-0 price-display">
        <span className="font-heading font-bold text-brand-charcoal tracking-tight">
          {mode === 'price' ? `${t.lkr} ${value || '0'}` : value || '0'}
        </span>
      </div>
      <div className="numpad-grid">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleKeyPress(btn)}
            className="numpad-btn bg-white border border-gray-200 flex items-center justify-center font-heading font-semibold text-brand-charcoal hover:bg-gray-100 active:bg-gray-200 transition-all shadow-sm"
          >
            {btn === 'Backspace' ? <Delete className="w-5 h-5" /> : btn === 'C' ? t.clear : btn}
          </button>
        ))}
      </div>
    </div>
  );
}
