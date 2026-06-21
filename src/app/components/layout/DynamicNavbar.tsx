"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '../context/TenantContext';

export const DynamicNavbar: React.FC = () => {
  const { tenant } = useTenant();
  const pathname = usePathname();

  if (!tenant || !tenant.navigation || tenant.navigation.length === 0) {
    return null; // Empty fallback if no dynamic menus are defined
  }

  return (
    <nav className="flex items-center space-x-6 py-4 px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {tenant.navigation.map((item, index) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={index}
            href={item.path}
            className={`text-sm font-medium transition-colors hover:text-[#01796f] ${
              isActive ? 'text-[#01796f] border-b-2 border-[#01796f]' : 'text-zinc-600 dark:text-zinc-300'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default DynamicNavbar;
