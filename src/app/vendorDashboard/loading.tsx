import React from 'react';
import { Skeleton, SkeletonCircle } from '../components/shared/Skeleton/Skeleton';

export default function Loading() {
    return (
        <div className="flex h-screen bg-[var(--background-color,#D6E6F3)] overflow-hidden">
            {/* Sidebar Skeleton */}
            <aside className="w-64 border-r border-white/80 bg-white/40 p-6 flex flex-col gap-8 shrink-0 hidden md:flex backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <SkeletonCircle size={40} className="opacity-40 bg-teal-900/10" />
                    <Skeleton width={120} height={24} className="opacity-40 bg-teal-900/10" />
                </div>

                <nav className="flex flex-col gap-4 mt-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <SkeletonCircle size={24} className="opacity-20 bg-teal-900/5" />
                            <Skeleton width={140} height={16} className="opacity-20 bg-teal-900/5" />
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-10 animate-pulse">
                    <div className="flex flex-col gap-2">
                        <Skeleton width={250} height={40} className="opacity-40 rounded-lg bg-teal-900/10" />
                        <Skeleton width={400} height={16} className="opacity-20 rounded-full bg-teal-900/5" />
                    </div>
                    <SkeletonCircle size={48} className="opacity-40 bg-teal-900/10" />
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm">
                            <Skeleton width={100} height={14} className="mb-4 opacity-20 bg-teal-900/5" />
                            <Skeleton width={150} height={32} className="opacity-40 bg-teal-900/10" />
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm p-6 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-6">
                        <Skeleton width={150} height={24} className="opacity-40 bg-teal-900/10" />
                        <div className="flex gap-2">
                            <Skeleton width={80} height={36} className="opacity-20 rounded-lg bg-teal-900/5" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-4 border-b border-teal-900/5 last:border-0">
                                <div className="flex items-center gap-4">
                                    <SkeletonCircle size={40} className="opacity-20 bg-teal-900/5" />
                                    <Skeleton width={200} height={20} className="opacity-20 bg-teal-900/5" />
                                </div>
                                <Skeleton width={100} height={20} className="opacity-20 bg-teal-900/5" />
                            </div>
                        ))}
                    </div>

                    {/* Subtle shimmer across the table */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent shimmer" />
                </div>
            </main>
        </div>
    );
}
