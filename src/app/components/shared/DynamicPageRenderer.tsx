
"use client";

import React, { lazy, Suspense } from 'react';

interface WidgetConfig {
  widget: string;
  props: Record<string, unknown>;
}

interface SectionConfig {
  id: string;
  columns: number;
  components: WidgetConfig[];
}

interface PageSchema {
  layout: string; // e.g. "grid-12"
  sections: SectionConfig[];
}

// Lazy load standard component cards to optimize bundle splitting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WidgetRegistry: Record<string, React.ComponentType<any>> = {
  StatCard: lazy(() => import('./StatCard')),
  RecentOrders: lazy(() => import('./RecentOrders')),
  SystemAlerts: lazy(() => import('./SystemAlerts'))
};

// Fallback component for unregistered widgets
const FallbackWidget: React.FC<{ name: string }> = ({ name }) => (
  <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded text-xs">
    Widget <strong>{name}</strong> not registered in system components.
  </div>
);

export const DynamicPageRenderer: React.FC<{ schema: PageSchema }> = ({ schema }) => {
  if (!schema || !schema.sections) {
    return <div className="p-4 text-zinc-400 text-sm">No page schema configured.</div>;
  }

  return (
    <div className={`grid gap-6 ${schema.layout === 'grid-12' ? 'grid-cols-12' : 'grid-cols-1'}`}>
      {schema.sections.map((section) => (
        <div 
          key={section.id} 
          className="col-span-12 grid gap-6"
          style={{ gridTemplateColumns: `repeat(${section.columns || 12}, minmax(0, 1fr))` }}
        >
          {section.components.map((comp, idx) => {
            const WidgetComponent = WidgetRegistry[comp.widget];
            return (
              <div key={idx} className="col-span-full md:col-span-1">
                <Suspense fallback={<div className="h-24 bg-zinc-100 animate-pulse rounded" />}>
                  {WidgetComponent ? (
                    <WidgetComponent {...comp.props} />
                  ) : (
                    <FallbackWidget name={comp.widget} />
                  )}
                </Suspense>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default DynamicPageRenderer;
