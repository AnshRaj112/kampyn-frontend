import axios from 'axios';

const isAdminRequest = (url: string) => {
    const normalizedUrl = (url || '').toLowerCase();
    return normalizedUrl.includes('/api/admin/') ||
        normalizedUrl.includes('/api/invoices/admin') ||
        normalizedUrl.includes('/api/invoices/stats') ||
        normalizedUrl.includes('/api/invoices/bulk') ||
        /(^|\/\/[^/]+)?\/admin(\/|$)/.test(normalizedUrl);
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const getTenantSlugFromHostname = (): string => {
    if (typeof window === 'undefined') return '';
    const hostname = window.location.hostname;
    const parts = hostname.toLowerCase().split('.');
    const reservedSubdomains = ["admin", "api", "www", "main", "tenant-studio"];

    if (parts.length === 2 && parts[1] === 'localhost') {
        if (!reservedSubdomains.includes(parts[0])) {
            return parts[0];
        }
    } else if (parts.length >= 3) {
        if (!reservedSubdomains.includes(parts[0])) {
            return parts[0];
        }
    }
    return '';
};

const getForcedLoginRedirectForPath = (pathname: string): string | null => {
    const path = (pathname || "").toLowerCase();
    if (!path) return null;

    // Vendor protected areas
    if (path.includes("/vendordashboard")) {
        return "/vendor-login";
    }

    // Guest-house manager protected area
    if (path.includes("/guest-house-dashboard")) {
        return "/guest-house-login";
    }

    // Tenant Studio protected area
    if (path.includes("/tenant-studio")) {
        return "/tenant-login";
    }

    // Uni protected areas (including auditorium + guest-house uni dashboards)
    if (
        path.includes("/food-ordering-unidashboard") ||
        path.includes("/guest-house-booking-unidashboard") ||
        path.includes("/auditorium-booking-unidashboard") ||
        path.includes("/unidashboard")
    ) {
        return "/uni-login";
    }

    return null;
};

/**
 * Get authentication headers. 
 * Note: Tokens are now handled via HTTP-only cookies.
 * This is kept for backward compatibility if any custom headers are needed.
 */
export const getAuthHeaders = () => {
    return {};
};

/**
 * Get standard axios configuration with credentials and auth headers.
 */
export const getAuthConfig = () => {
    return {
        headers: getAuthHeaders(),
        withCredentials: true,
    };
};

/**
 * Standard axios instance with base URL and default config.
 * Used for authenticated dashboard requests.
 */
export const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to handle Authorization and Tenant headers
api.interceptors.request.use(
    (config) => {
        // Attach Bearer token and tenant header for cross-origin requests
        if (typeof window !== 'undefined') {
            const tenantSlug = getTenantSlugFromHostname();
            if (tenantSlug) {
                config.headers['X-Tenant'] = tenantSlug;
            }

            const pathname = window.location.pathname;
            const forcedLogin = getForcedLoginRedirectForPath(pathname);
            const hasToken = Boolean(localStorage.getItem("token") || localStorage.getItem("adminToken"));
            if (forcedLogin && !hasToken && pathname !== forcedLogin) {
                window.location.href = forcedLogin;
                return Promise.reject(new axios.Cancel("Redirecting to role login"));
            }

            const url = config.url || '';
            const isAdminRoute = isAdminRequest(url);
            const token = isAdminRoute ? localStorage.getItem('adminToken') : localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle specialized errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
            const pathname = window.location.pathname;
            const forcedLogin = getForcedLoginRedirectForPath(pathname);
            if (forcedLogin && pathname !== forcedLogin) {
                window.location.href = forcedLogin;
                return Promise.reject(error);
            }

            // Check if we are in a dashboard area that requires authentication
            const currentPathname = window.location.pathname;
            // Restrict auto-redirects to admin and vendor dashboards only.
            // Uni dashboards and user pages handle 401s themselves.
            const isDashboardArea =
                currentPathname.includes('admin-dashboard') ||
                currentPathname.includes('vendordashboard');

            if (isDashboardArea) {
                const url = error.config?.url || '';

                // Only redirect if the 401 error comes from an endpoint that matches the dashboard role.
                // This prevents "shopper" side 401s (like SearchCartContext profile checks) from 
                // accidentally logging out vendors or administrators.

                let shouldRedirect = false;
                let targetLogin = '/login';

                if (currentPathname.includes('admin-dashboard') && url.includes('/api/admin')) {
                    shouldRedirect = true;
                    targetLogin = '/admin-login';
                } else if (currentPathname.includes('vendordashboard') && url.includes('/api/vendor')) {
                    shouldRedirect = true;
                    targetLogin = '/vendor-login';
                } else if (currentPathname.includes('uniDashboard') && url.includes('/api/uni')) {
                    shouldRedirect = true;
                    targetLogin = '/uni-login';
                }

                if (shouldRedirect) {
                    console.warn(`Unauthorized ${url} access in ${currentPathname}. Redirecting to ${targetLogin}.`);
                    window.location.href = targetLogin;
                } else {
                    console.info(`Silent 401 on ${url} in ${currentPathname} (ignored by global interceptor)`);
                }
            }
        }
        return Promise.reject(error);
    }
);

/**
 * User-side axios instance with credentials and auth.
 * Used for user-specific features like cart, orders, and favorites.
 */
export const userApi = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

userApi.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const tenantSlug = getTenantSlugFromHostname();
        if (tenantSlug) {
            config.headers['X-Tenant'] = tenantSlug;
        }

        const url = config.url || '';
        const isAdminRoute = isAdminRequest(url);
        const token = isAdminRoute ? localStorage.getItem('adminToken') : localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

/**
 * Register a secondary university sub-administrator for Tenant Studio
 */
export const signupSubAdmin = async (formData: Record<string, string>) => {
    return api.post('/api/uni/auth/sub-admin/signup', formData);
};

export default api;
