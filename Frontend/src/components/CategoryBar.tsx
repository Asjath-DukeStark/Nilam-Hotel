import { Language, translations } from '../translations';
import React from 'react';
import { Camera } from 'lucide-react';
import { useItemImage } from '../hooks/useItemImage';

function CategoryButton({ cat, isSelected, onClick }: any) {
  const [image, setImage] = useItemImage(`cat_${cat.id}`);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <button
      onClick={onClick}
      className={`category-btn shadow-sm shrink-0 active:scale-95 transition-all outline-none ${
        isSelected ? 'bg-amber-50 border-[2px] border-brand-primary' : 'bg-white border border-gray-200'
      }`}
    >
      <div className={`cat-icon-area ${isSelected ? 'border-amber-200' : ''}`}>
        {image ? (
          <img src={image} alt={cat.label} />
        ) : (
          <span className={`fallback-initial font-heading ${isSelected ? 'text-amber-500' : 'text-gray-400'}`}>
            {cat.initial}
          </span>
        )}
        <label onClick={(e) => e.stopPropagation()} className="cat-upload-btn text-gray-500 hover:text-gray-700">
          <Camera style={{ width: '10px', height: '10px' }} />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>
      <span className={`cat-label font-heading ${isSelected ? 'text-brand-primary font-bold' : 'text-brand-charcoal'}`}>
        {cat.label}
      </span>
    </button>
  );
}

interface CategoryBarProps {
  language: Language;
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
}

export function CategoryBar({ language, selectedCategory, onSelectCategory }: CategoryBarProps) {
  const t = translations[language];
  
  const categories = [
    { id: 'kottu', label: t.kottu, initial: 'K' },
    { id: 'dolphinKottu', label: t.dolphinKottu, initial: 'DK' },
    { id: 'rice', label: t.rice, initial: 'R' },
    { id: 'dhosai', label: t.dhosai, initial: 'D' },
    { id: 'meals', label: t.meals, initial: 'M' },
    { id: 'gravy', label: t.gravy, initial: 'G' },
    { id: 'shorties', label: t.shorties, initial: 'S' },
    { id: 'beverage', label: t.beverage, initial: 'B' },
    { id: 'hot', label: t.hot, initial: 'H' },
  ];

  return (
    <div className="category-bar">
      {categories.map((cat) => (
        <CategoryButton
          key={cat.id}
          cat={cat}
          isSelected={selectedCategory === cat.id}
          onClick={() => onSelectCategory(cat.id)}
        />
      ))}
    </div>
  );
}

