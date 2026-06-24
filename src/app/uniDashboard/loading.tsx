import React from 'react';
import { Skeleton } from '../components/shared/Skeleton/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[var(--background-color,#D6E6F3)] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl text-center mb-16 animate-pulse">
                <Skeleton width={400} height={48} className="mx-auto mb-4 rounded-xl opacity-60 bg-teal-900/10" />
                <Skeleton width={600} height={24} className="mx-auto rounded-full opacity-40 bg-teal-900/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="group relative p-8 rounded-3xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/10 to-teal-600/10 flex items-center justify-center">
                            <Skeleton width={40} height={40} className="rounded-xl opacity-40" />
                        </div>
                        <div className="flex flex-col gap-3 items-center w-full">
                            <Skeleton width="60%" height={28} className="rounded-lg opacity-40" />
                            <Skeleton width="80%" height={16} className="rounded-full opacity-20" />
                        </div>
                        <div className="w-full h-px bg-teal-900/5" />
                        <Skeleton width={120} height={40} className="rounded-xl opacity-30" />

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent shimmer" />
                    </div>
                ))}
            </div>
        </div>
    );
}
