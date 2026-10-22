'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ShopInfo {
  name: string;
  phone: string;
  address: string;
  email?: string;
  description?: string;
  hotline?: string;
  zalo_url?: string;
  facebook_url?: string;
  support_message?: string;
}

export interface ShippingSettings {
  ship_hcm: number;
  ship_other: number;
  free_ship_threshold: number;
}

export interface BankAccountSettings {
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_timeout_minutes: number;
}

export interface SettingsContextType {
  shopInfo: ShopInfo;
  shipping: ShippingSettings;
  bankAccount: BankAccountSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultShopInfo: ShopInfo = {
  name: 'chocomino shop',
  phone: '0900000000',
  address: 'Đ. Số 2/38/32 Bình Đường 1, Khu Phố, Dĩ An, TP. Hồ Chí Minh',
  email: 'contact@chocomino.vn',
  description:
    'Tiệm đồ chơi squishy mềm mịn, bồng bềnh, chậm tăng chuẩn xịn. Mang lại niềm vui và cảm giác thư giãn cho bạn mỗi ngày!',
  hotline: '0900000000',
  zalo_url: 'https://zalo.me/0900000000',
  facebook_url: 'https://m.me/chocomino.squishy',
  support_message:
    'Cần tư vấn mẫu squishy bóp êm hoặc hỗ trợ đơn hàng? Nhắn tin ngay cho tụi mình nhé:',
};

const defaultShipping: ShippingSettings = {
  ship_hcm: 18000,
  ship_other: 22000,
  free_ship_threshold: 0,
};

const defaultBankAccount: BankAccountSettings = {
  bank_name: 'Techcombank',
  account_number: '',
  account_holder: 'NGUYEN VAN TRUNG',
  qr_timeout_minutes: 15,
};

const SettingsContext = createContext<SettingsContextType>({
  shopInfo: defaultShopInfo,
  shipping: defaultShipping,
  bankAccount: defaultBankAccount,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [shopInfo, setShopInfo] = useState<ShopInfo>(defaultShopInfo);
  const [shipping, setShipping] = useState<ShippingSettings>(defaultShipping);
  const [bankAccount, setBankAccount] = useState<BankAccountSettings>(defaultBankAccount);
  const [isLoading, setIsLoading] = useState(true);

  const applyCachedSettings = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('chocomino_shop_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.shop_info) {
          setShopInfo((prev) => ({
            ...prev,
            ...parsed.shop_info,
            name: parsed.shop_info.name || prev.name,
            phone: parsed.shop_info.phone || prev.phone,
            address: parsed.shop_info.address || prev.address,
            hotline: parsed.shop_info.hotline || parsed.shop_info.phone || prev.hotline,
            zalo_url: parsed.shop_info.zalo_url || prev.zalo_url,
            facebook_url: parsed.shop_info.facebook_url || prev.facebook_url,
            support_message: parsed.shop_info.support_message || prev.support_message,
          }));
        }
        if (parsed.shipping) {
          setShipping((prev) => ({
            ...prev,
            ship_hcm: parsed.shipping.ship_hcm !== undefined ? Number(parsed.shipping.ship_hcm) : prev.ship_hcm,
            ship_other: parsed.shipping.ship_other !== undefined ? Number(parsed.shipping.ship_other) : prev.ship_other,
            free_ship_threshold: parsed.shipping.free_ship_threshold !== undefined ? Number(parsed.shipping.free_ship_threshold) : prev.free_ship_threshold,
          }));
        }
        if (parsed.bank_account) {
          setBankAccount((prev) => ({
            ...prev,
            ...parsed.bank_account,
          }));
        }
      }
    } catch (e) {
      console.warn('[SettingsContext] Failed reading cached settings:', e);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json().catch(() => null);
      if (data?.success && data?.settings) {
        const s = data.settings;
        if (s.shop_info) {
          setShopInfo((prev) => ({
            ...prev,
            ...s.shop_info,
            name: s.shop_info.name || prev.name,
            phone: s.shop_info.phone || prev.phone,
            address: s.shop_info.address || prev.address,
            hotline: s.shop_info.hotline || s.shop_info.phone || prev.hotline,
            zalo_url: s.shop_info.zalo_url || prev.zalo_url,
            facebook_url: s.shop_info.facebook_url || prev.facebook_url,
            support_message: s.shop_info.support_message || prev.support_message,
            description: s.shop_info.description || prev.description,
          }));
        }
        if (s.shipping) {
          setShipping((prev) => ({
            ...prev,
            ship_hcm: s.shipping.ship_hcm !== undefined ? Number(s.shipping.ship_hcm) : prev.ship_hcm,
            ship_other: s.shipping.ship_other !== undefined ? Number(s.shipping.ship_other) : prev.ship_other,
            free_ship_threshold: s.shipping.free_ship_threshold !== undefined ? Number(s.shipping.free_ship_threshold) : prev.free_ship_threshold,
          }));
        }
        if (s.bank_account) {
          setBankAccount((prev) => ({
            ...prev,
            ...s.bank_account,
          }));
        }
      }
    } catch (e) {
      console.warn('[SettingsContext] Fetching settings error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Hydrate from local cache immediately
    applyCachedSettings();

    // 2. Fetch fresh settings from server
    refreshSettings();

    // 3. Listen to local update events (e.g., when saved in Admin Settings)
    const handleUpdate = () => {
      applyCachedSettings();
      refreshSettings();
    };

    window.addEventListener('chocomino_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('chocomino_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [applyCachedSettings, refreshSettings]);

  return (
    <SettingsContext.Provider
      value={{
        shopInfo,
        shipping,
        bankAccount,
        isLoading,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
