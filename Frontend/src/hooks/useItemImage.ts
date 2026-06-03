import { useState, useEffect } from 'react';

export function useItemImage(itemId: string) {
  const key = `img_${itemId}`;
  const [image, setImage] = useState<string | null>(() => {
    return window.localStorage.getItem(key) || null;
  });

  useEffect(() => {
    const handleReset = () => {
      setImage(window.localStorage.getItem(key) || null);
    };
    window.addEventListener('imagesUpdated', handleReset);
    return () => window.removeEventListener('imagesUpdated', handleReset);
  }, [key]);

  const updateImage = (base64: string | null) => {
    try {
      if (base64) {
        window.localStorage.setItem(key, base64);
      } else {
        window.localStorage.removeItem(key);
      }
      setImage(base64);
    } catch(e) {
      console.error(e);
      alert('Failed to save image. Storage might be full.');
    }
  };

  return [image, updateImage] as const;
}

export function resetAllImages() {
  const keysToRemove = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('img_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => window.localStorage.removeItem(k));
  window.dispatchEvent(new Event('imagesUpdated'));
}
