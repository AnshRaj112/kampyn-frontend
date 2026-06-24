import React from 'react';
import { Skeleton, SkeletonCard } from '../../components/shared/Skeleton/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[var(--background-color,#D6E6F3)] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Banner Skeleton */}
                <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-12 animate-pulse">
                    <Skeleton width="100%" height="100%" className="opacity-20 bg-teal-900/10" />
                    <div className="absolute bottom-8 left-8 flex flex-col gap-3">
                        <Skeleton width={300} height={40} className="rounded-lg opacity-60 bg-white/40" />
                        <Skeleton width={200} height={20} className="rounded-full opacity-40 bg-white/20" />
                    </div>
                </div>

                {/* Categories Scroll Skeleton */}
                <div className="flex gap-4 mb-10 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} width={120} height={40} className="rounded-full shrink-0 bg-white/60 backdrop-blur-md border border-white/80" />
                    ))}
                </div>

                {/* Food Items Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm" />
                    ))}
                </div>
            </div>
        </div>
    );
}
