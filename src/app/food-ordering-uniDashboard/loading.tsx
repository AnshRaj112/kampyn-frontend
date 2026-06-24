import React from 'react';
import { Skeleton, SkeletonCircle } from '../components/shared/Skeleton/Skeleton';

export default function Loading() {
    return (
        <div className="flex h-screen bg-[var(--background-color,#D6E6F3)] overflow-hidden">
            {/* Sidebar Skeleton */}
            <aside className="w-64 border-r border-white/80 bg-white/40 p-6 flex flex-col gap-8 shrink-0 hidden md:flex backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" />
                    <Skeleton width={120} height={24} className="opacity-40 bg-indigo-900/10" />
                </div>

                <nav className="flex flex-col gap-4 mt-8">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton width={140} height={16} className="opacity-20 bg-indigo-900/5" />
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-10">
                    <header className="mb-10 animate-pulse flex flex-col gap-4">
                        <Skeleton width={300} height={40} className="opacity-40 rounded-lg bg-indigo-900/10" />
                        <Skeleton width={500} height={16} className="opacity-20 rounded-full bg-indigo-900/5" />
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <SkeletonCircle size={48} className="opacity-20 bg-indigo-900/10" />
                                    <div className="flex flex-col gap-2 flex-1">
                                        <Skeleton width="70%" height={20} className="opacity-30 bg-indigo-900/10" />
                                        <Skeleton width="40%" height={14} className="opacity-20 bg-indigo-900/5" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Skeleton width="100%" height={12} className="opacity-10 bg-indigo-900/5" />
                                    <Skeleton width="90%" height={12} className="opacity-10 bg-indigo-900/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
