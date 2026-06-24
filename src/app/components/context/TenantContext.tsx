"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { api, getTenantSlugFromHostname } from '../../../utils/apiUtils';
import TenantNotOnboarded from '../TenantNotOnboarded';

interface TenantBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  backgroundColor?: string;
}

interface TenantNavigationItem {
  label: string;
  path: string;
  icon?: string;
  roles?: string[];
}

interface TenantConfig {
  _id: string;
  name: string;
  slug: string;
  branding: TenantBranding;
  enabledModules: string[];
  navigation: TenantNavigationItem[];
  widgets?: string[];
  workflows?: {
    approvalRole?: string;
    outingLimit?: number;
  };
  createdByUniName?: string;
}

interface TenantContextProps {
  tenant: TenantConfig | null;
  loading: boolean;
  isModuleEnabled: (moduleName: string) => boolean;
  refetchTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');

  const clearBranding = useCallback(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--primary-color-rgb');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--secondary-color-rgb');
    root.style.removeProperty('--background-color');
    root.style.removeProperty('--background-color-rgb');
    root.style.removeProperty('--font-family');
    
    document.body.style.backgroundColor = '';
    document.body.style.fontFamily = '';

    const fontId = 'tenant-google-font';
    const fontLink = document.getElementById(fontId);
    if (fontLink) {
      fontLink.parentNode?.removeChild(fontLink);
    }

    const defaultFavicon = '/favicon.ico';
    const favicons = ['link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]'];
    favicons.forEach(selector => {
      const favEl = document.querySelector(selector) as HTMLLinkElement;
      if (favEl) {
        favEl.href = defaultFavicon;
      }
    });

    document.title = document.title.replace(/\s*-\s*KAMPYN\s*-\s*.+$/, 'KAMPYN').replace(/KAMPYN\s*-\s*.+$/, 'KAMPYN');
  }, []);

  const fetchTenantConfig = useCallback(async () => {
    const slug = getTenantSlugFromHostname();
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    if (!slug && !token) {
      setTenantSlug('');
      setTenant(null);
      clearBranding();
      setTenantNotFound(false);
      setLoading(false);
      return;
    }

    if (slug) {
      setTenantSlug(slug);
    }

    try {
      const response = await api.get('/api/tenant/config');
      if (response.data?.success && response.data?.data) {
        const tenantData = response.data.data;
        setTenant(tenantData);

        if (tenantData.slug) {
          setTenantSlug(tenantData.slug);
          if (typeof window !== 'undefined') {
            localStorage.setItem("currentTenantSlug", tenantData.slug);
          }
        }

        // Skip applying branding styles to administrative/management routes and static platform pages
        const path = window.location.pathname.toLowerCase();
        const isAdminRoute = path.includes('/admin-dashboard') || 
                             path.includes('/admin-login')

        if (isAdminRoute) {
          clearBranding();
        } else {
          applyBranding(tenantData);
        }
        setTenantNotFound(false);
      } else {
        setTenantNotFound(true);
      }
    } catch (error) {
      console.error("Failed to load tenant configuration:", error);
      setTenantNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [clearBranding]);

  useEffect(() => {
    fetchTenantConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    if (branding.backgroundColor) {
      root.style.setProperty('--background-color', branding.backgroundColor);
      root.style.setProperty('--background-color-rgb', hexToRgb(branding.backgroundColor));
      document.body.style.backgroundColor = branding.backgroundColor;
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

  const isModuleEnabled = useCallback((moduleName: string): boolean => {
    if (!tenant) return false;
    return tenant.enabledModules.includes(moduleName);
  }, [tenant]);

  const contextValue = useMemo(() => ({
    tenant,
    loading,
    isModuleEnabled,
    refetchTenant: fetchTenantConfig
  }), [tenant, loading, isModuleEnabled, fetchTenantConfig]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#01796f] border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-zinc-500 animate-pulse">Loading experience...</p>
      </div>
    );
  }

  if (tenantNotFound) {
    return <TenantNotOnboarded slug={tenantSlug} />;
  }

  return (
    <TenantContext.Provider value={contextValue}>
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
