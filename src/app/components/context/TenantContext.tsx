"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api, getTenantSlugFromHostname } from '../../../utils/apiUtils';
import TenantNotOnboarded from '../TenantNotOnboarded';
import {
  applyThemeDocument,
  clearThemeVars,
  pathnameToPageId,
  type ThemeDocument,
} from '@/theme';

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
  theme?: ThemeDocument | null;
  themeVersion?: number;
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

const isPlatformAdminRoute = (path: string) => {
  const p = path.toLowerCase();
  return p.includes('/admin-dashboard') || p.includes('/admin-login');
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('');
  const fetchedSlugRef = useRef<string | null>(null);
  const tenantRef = useRef<TenantConfig | null>(null);

  const clearBranding = useCallback(() => {
    if (typeof window === 'undefined') return;

    clearThemeVars();
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

  const applyBranding = useCallback((config: TenantConfig) => {
    if (typeof window === 'undefined') return;

    const { resolved } = applyThemeDocument(config.theme, config.branding);
    const color = resolved.tokens?.color;
    const typography = resolved.tokens?.typography;
    const assets = resolved.tokens?.assets;

    if (color?.background) {
      document.body.style.backgroundColor = color.background;
    }

    if (typography?.fontFamily) {
      const fontId = 'tenant-google-font';
      let fontLink = document.getElementById(fontId) as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontId;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = `https://fonts.googleapis.com/css2?family=${typography.fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
      document.body.style.fontFamily = `"${typography.fontFamily}", sans-serif`;
    }

    const favicon = assets?.favicon || config.branding?.favicon;
    if (favicon) {
      const favicons = ['link[rel="icon"]', 'link[rel="shortcut icon"]', 'link[rel="apple-touch-icon"]'];
      favicons.forEach(selector => {
        const favEl = document.querySelector(selector) as HTMLLinkElement;
        if (favEl) {
          favEl.href = favicon;
        } else if (selector.includes('shortcut')) {
          const newFav = document.createElement('link');
          newFav.rel = 'shortcut icon';
          newFav.href = favicon;
          document.head.appendChild(newFav);
        }
      });
    }

    if (config.name) {
      document.title = document.title.replace(/KAMPYN.*/, `KAMPYN - ${config.name}`);
    }
  }, []);

  const fetchTenantConfig = useCallback(async (force = false) => {
    const slug = getTenantSlugFromHostname();
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

    if (!slug && !token) {
      setTenantSlug('');
      setTenant(null);
      tenantRef.current = null;
      fetchedSlugRef.current = null;
      clearBranding();
      setTenantNotFound(false);
      setLoading(false);
      return;
    }

    if (slug) {
      setTenantSlug(slug);
    }

    // Avoid refetch on every navigation when we already have this tenant loaded
    const cacheKey = slug || (token ? `token:${token.slice(0, 12)}` : '');
    if (!force && fetchedSlugRef.current === cacheKey && tenantRef.current) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/tenant/config');
      if (response.data?.success && response.data?.data) {
        const tenantData = response.data.data as TenantConfig;
        setTenant(tenantData);
        tenantRef.current = tenantData;
        fetchedSlugRef.current = cacheKey;

        if (tenantData.slug) {
          setTenantSlug(tenantData.slug);
          if (typeof window !== 'undefined') {
            localStorage.setItem("currentTenantSlug", tenantData.slug);
          }
        }

        const path = window.location.pathname.toLowerCase();
        if (isPlatformAdminRoute(path)) {
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
  }, [clearBranding, applyBranding]);

  // Initial load + soft revalidate on tab focus
  useEffect(() => {
    fetchTenantConfig();

    const onFocus = () => {
      fetchTenantConfig(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page-scoped data attribute + admin route theme clear without full refetch
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const main = document.querySelector('main');
    const pageId = pathnameToPageId(pathname || '/');

    if (isPlatformAdminRoute(pathname || '')) {
      clearBranding();
      if (main) main.removeAttribute('data-page');
      return;
    }

    if (tenantRef.current) {
      applyBranding(tenantRef.current);
    }

    if (main) {
      if (pageId) {
        main.setAttribute('data-page', pageId);
      } else {
        main.removeAttribute('data-page');
      }
    }
  }, [pathname, clearBranding, applyBranding]);

  const isModuleEnabled = useCallback((moduleName: string): boolean => {
    if (!tenant) return false;
    return tenant.enabledModules.includes(moduleName);
  }, [tenant]);

  const refetchTenant = useCallback(async () => {
    await fetchTenantConfig(true);
  }, [fetchTenantConfig]);

  const contextValue = useMemo(() => ({
    tenant,
    loading,
    isModuleEnabled,
    refetchTenant
  }), [tenant, loading, isModuleEnabled, refetchTenant]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[var(--kampyn-color-primary,#01796f)] border-t-transparent"></div>
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
