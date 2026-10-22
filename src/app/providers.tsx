'use client';

import React, { useEffect } from 'react';
import { CartProvider } from '@/context/CartContext';

function UtmCapture() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const utm = params.get('utm_source');
        if (utm) {
          sessionStorage.setItem('chocomino_utm_source', utm.toLowerCase());
        }
      } catch (e) {
        // Safe catch for restricted environments
      }
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <UtmCapture />
      {children}
    </CartProvider>
  );
}
