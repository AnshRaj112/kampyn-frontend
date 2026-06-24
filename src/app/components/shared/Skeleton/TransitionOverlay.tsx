import React from 'react';
import { Skeleton, SkeletonCircle } from './Skeleton';

export const TransitionOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] bg-[var(--background-color,#D6E6F3)] pt-24 px-4 md:px-8 pb-12 overflow-hidden animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">
                {/* Header Section Skeleton */}
                <div className="flex flex-col items-center text-center mb-16 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-emerald-500/20 mb-6 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-2 border-teal-500/20 border-t-teal-600 animate-spin" />
                    </div>
                    <Skeleton width={300} height={48} className="mb-4 rounded-full opacity-60 bg-teal-900/10" />
                    <Skeleton width={450} height={20} className="rounded-full opacity-40 bg-teal-900/5" />
                </div>

                {/* College Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div
                            key={i}
                            className="relative p-6 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-4 relative z-10">
                                <SkeletonCircle size={40} className="shrink-0 opacity-40 bg-teal-900/10" />
                                <div className="flex-1">
                                    <Skeleton width="80%" height={24} className="rounded-md opacity-40 bg-teal-900/10" />
                                </div>
                                <SkeletonCircle size={32} className="shrink-0 opacity-20 bg-teal-900/5" />
                            </div>

                            {/* Subtle shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent shimmer" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Loading Text */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                <span className="text-teal-900/40 text-sm font-medium tracking-widest uppercase animate-pulse">
                    Preparing your campus hub
                </span>
            </div>
        </div>
    );
};
