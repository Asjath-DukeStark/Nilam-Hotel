import { motion } from 'motion/react';
import { Language, translations } from '../translations';

interface ModeSelectorProps {
  key?: string | number;
  onSelectMode: (mode: 'DINE_IN' | 'TAKEAWAY') => void;
  language: Language;
  onToggleLanguage: () => void;
}

export function ModeSelector({ onSelectMode, language, onToggleLanguage }: ModeSelectorProps) {
  const t = translations[language];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-dvh bg-brand-charcoal text-white p-6 relative w-full h-full"
    >
      <button 
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 px-6 py-3 bg-white/10 rounded-full font-heading font-semibold text-lg hover:bg-white/20 transition-colors min-w-[100px] min-h-[48px] active:scale-95"
      >
        {language === 'en' ? 'தமிழ்' : 'EN'}
      </button>

      <h1 className="text-4xl md:text-5xl font-heading font-bold mb-12 text-center">{t.appTitle}</h1>
      
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
        <button 
          onClick={() => onSelectMode('DINE_IN')}
          className="flex-1 bg-white text-brand-charcoal rounded-3xl p-12 hover:scale-105 transition-transform active:scale-95 min-h-[300px] flex flex-col items-center justify-center shadow-lg group"
        >
          <span className="text-4xl font-heading font-bold tracking-tight group-hover:text-amber-600 transition-colors">{t.dineIn}</span>
        </button>
        <button 
          onClick={() => onSelectMode('TAKEAWAY')}
          className="flex-1 bg-brand-primary text-white rounded-3xl p-12 hover:scale-105 transition-transform active:scale-95 min-h-[300px] flex flex-col items-center justify-center shadow-lg hover:bg-amber-700"
        >
          <span className="text-4xl font-heading font-bold tracking-tight">{t.takeaway}</span>
        </button>
      </div>
    </motion.div>
  );
}
