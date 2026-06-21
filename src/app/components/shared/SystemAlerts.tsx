"use client";

import React from 'react';

interface SystemAlertsProps {
  title?: string;
  alerts?: string[];
}

export const SystemAlerts: React.FC<SystemAlertsProps> = ({
  title = "Notice Board",
  alerts = [
    "Food court closing times extended to 11:00 PM for exam season.",
    "Hostel maintenance scheduled for Blocks A & B on Sunday."
  ]
}) => {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">{title}</h3>
      <ul className="space-y-2">
        {alerts.map((alert, idx) => (
          <li key={idx} className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded border-l-4 border-[#01796f]">
            {alert}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SystemAlerts;
