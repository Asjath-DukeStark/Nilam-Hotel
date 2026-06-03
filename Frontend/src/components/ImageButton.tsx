import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { useItemImage } from '../hooks/useItemImage';

export function ImageButton({ 
  itemId, 
  fallbackInitial, 
  label, 
  subLabel, 
  isSelected, 
  onClick, 
  className = "",
  labelClassName = "text-[15px] leading-tight"
}: any) {
  const [image, setImage] = useItemImage(itemId);

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

  const hasImage = !!image;

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col justify-end items-center overflow-hidden shrink-0 transition-all active:scale-95 group ${className} ${
        isSelected ? 'border-[3px] border-brand-primary' : 'border border-gray-200'
      }`}
    >
      <div className="absolute inset-0">
        {hasImage ? (
          <>
            <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 transition-opacity group-hover:bg-black/60"></div>
          </>
        ) : (
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-colors ${isSelected ? 'bg-amber-50' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
            {fallbackInitial ? (
              <span className={`text-5xl font-bold tracking-tighter mb-4 font-heading ${isSelected ? 'text-amber-200' : 'text-gray-300'}`}>{fallbackInitial}</span>
            ) : (
              <ImageIcon className={`w-10 h-10 mb-4 ${isSelected ? 'text-amber-300' : 'text-gray-300'}`} />
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-2 pb-3 drop-shadow-md">
        <span className={`font-heading font-bold text-center text-balance overflow-hidden text-ellipsis line-clamp-2 ${labelClassName} ${hasImage ? 'text-white' : (isSelected ? 'text-brand-primary drop-shadow-none' : 'text-brand-charcoal drop-shadow-none')}`}>
          {label}
        </span>
        {subLabel && (
          <span className={`text-sm font-semibold mt-0.5 ${hasImage ? 'text-amber-300' : (isSelected ? 'text-amber-600 drop-shadow-none' : 'text-gray-500 drop-shadow-none')}`}>
            {subLabel}
          </span>
        )}
      </div>

      <label 
        className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full cursor-pointer shadow-md active:scale-95 transition-all text-gray-600 z-20"
        onClick={(e) => e.stopPropagation()}
        title="Upload Image"
      >
        <Camera className="w-4 h-4" />
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </label>
    </button>
  );
}
