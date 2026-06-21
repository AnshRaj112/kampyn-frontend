"use client";

import React from 'react';

interface OrderItem {
  id: string;
  item: string;
  price: string;
  status: string;
}

interface RecentOrdersProps {
  title?: string;
  orders?: OrderItem[];
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ 
  title = "Recent Activity", 
  orders = [
    { id: "#1209", item: "Veg Thali", price: "₹120", status: "In Progress" },
    { id: "#1208", item: "Cheese Burger", price: "₹85", status: "Delivered" }
  ] 
}) => {
  return (
    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4">{title}</h3>
      <div className="space-y-3">
        {orders.map((order, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <div>
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{order.item}</p>
              <p className="text-xs text-zinc-400">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{order.price}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
