import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText } from '../components/shared/Skeleton/Skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[var(--background-color,#D6E6F3)] pt-32 px-4 md:px-8 pb-12">
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
                {/* Cart Items Section */}
                <div className="flex-1 space-y-4">
                    <header className="mb-8">
                        <Skeleton width={200} height={40} className="rounded-lg opacity-60 bg-teal-900/10" />
                    </header>

                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm flex gap-6 items-center">
                            <Skeleton width={100} height={100} className="rounded-xl shrink-0 bg-teal-900/5" />
                            <div className="flex-1">
                                <Skeleton width="60%" height={24} className="mb-3 bg-teal-900/10" />
                                <SkeletonText lines={2} className="opacity-40 bg-teal-900/5" />
                            </div>
                            <div className="flex items-center gap-3">
                                <SkeletonCircle size={32} className="bg-teal-900/5" />
                                <Skeleton width={40} height={32} className="bg-teal-900/10" />
                                <SkeletonCircle size={32} className="bg-teal-900/5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Sidebar Skeleton */}
                <div className="w-full lg:w-96">
                    <div className="p-8 rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-lg sticky top-32">
                        <Skeleton width={150} height={28} className="mb-8 bg-teal-900/10" />
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between">
                                <Skeleton width={100} height={20} className="bg-teal-900/5" />
                                <Skeleton width={60} height={20} className="bg-teal-900/10" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton width={120} height={20} className="bg-teal-900/5" />
                                <Skeleton width={60} height={20} className="bg-teal-900/10" />
                            </div>
                            <div className="h-px bg-teal-900/5" />
                            <div className="flex justify-between">
                                <Skeleton width={100} height={28} className="bg-teal-900/10" />
                                <Skeleton width={80} height={28} className="bg-teal-900/20" />
                            </div>
                        </div>
                        <Skeleton width="100%" height={56} className="rounded-2xl bg-teal-600/20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
