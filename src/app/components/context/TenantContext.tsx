"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../../utils/apiUtils';

interface TenantBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
}

interface TenantConfig {
  name: string;
  slug: string;
  branding: TenantBranding;
  enabledModules: string[];
}

interface TenantContextProps {
  tenant: TenantConfig | null;
  loading: boolean;
  isModuleEnabled: (moduleName: string) => boolean;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        const response = await api.get('/api/tenant/config');
        if (response.data?.success && response.data?.data) {
          const tenantData = response.data.data;
          setTenant(tenantData);
          applyBranding(tenantData);
        }
      } catch (error) {
        console.error("Failed to load tenant configuration:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenantConfig();
  }, []);

  const applyBranding = (config: TenantConfig) => {
    if (typeof window === 'undefined') return;

    const branding = config.branding;
    const root = document.documentElement;

    // Apply primary & secondary colors to CSS variables
    if (branding.primaryColor) {
      root.style.setProperty('--primary-color', branding.primaryColor);
      // For Tailwind border & text color mappings if they use custom class mappings or fallback to custom inline colors
      root.style.setProperty('--primary-color-rgb', hexToRgb(branding.primaryColor));
    }
    if (branding.secondaryColor) {
      root.style.setProperty('--secondary-color', branding.secondaryColor);
      root.style.setProperty('--secondary-color-rgb', hexToRgb(branding.secondaryColor));
    }

    // Apply custom font dynamic styling
    if (branding.font) {
      root.style.setProperty('--font-family', branding.font);
      
      const fontId = 'tenant-google-font';
      let fontLink = document.getElementById(fontId) as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontId;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = `https://fonts.googleapis.com/css2?family=${branding.font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
      document.body.style.fontFamily = `"${branding.font}", sans-serif`;
    }

    // Apply custom favicon
    if (branding.favicon) {
      const favicons = ['link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]'];
      favicons.forEach(selector => {
        const favEl = document.querySelector(selector) as HTMLLinkElement;
        if (favEl) {
          favEl.href = branding.favicon!;
        } else if (selector.includes('shortcut')) {
          const newFav = document.createElement('link');
          newFav.rel = 'shortcut icon';
          newFav.href = branding.favicon!;
          document.head.appendChild(newFav);
        }
      });
    }

    // Apply tab document title suffix
    if (config.name) {
      document.title = document.title.replace(/KAMPYN.*/, `KAMPYN - ${config.name}`);
    }
  };

  const hexToRgb = (hex: string): string => {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(char => char + char).join('');
    }
    const num = parseInt(cleanHex, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `${r}, ${g}, ${b}`;
  };

  const isModuleEnabled = (moduleName: string): boolean => {
    if (!tenant) return false;
    return tenant.enabledModules.includes(moduleName);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#01796f] border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-zinc-500 animate-pulse">Loading experience...</p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, isModuleEnabled }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
