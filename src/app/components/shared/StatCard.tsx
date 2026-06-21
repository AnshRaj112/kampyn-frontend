"use client";

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, color }) => {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</p>
      <h3 className="mt-2 text-2xl font-bold" style={{ color: color || 'var(--primary-color)' }}>
        {value}
      </h3>
      {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
    </div>
  );
};

export default StatCard;
