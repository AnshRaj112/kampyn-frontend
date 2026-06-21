"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TenantNotOnboardedProps {
  slug: string;
}

export default function TenantNotOnboarded({ slug }: TenantNotOnboardedProps) {
  const [baseDomainUrl, setBaseDomainUrl] = useState("https://kampyn.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.includes("localhost")) {
        setBaseDomainUrl("http://localhost:3000");
      } else {
        setBaseDomainUrl("https://kampyn.com");
      }
    }
  }, []);

  const mailtoUrl = `mailto:contact@kampyn.com?subject=Onboarding%20Request%20for%20${encodeURIComponent(
    slug || "our"
  )}%20Campus&body=Hello%20KAMPYN%20Team%2C%0A%0AI%20would%20like%20to%20request%20onboarding%20for%20our%20campus%20(${encodeURIComponent(
    slug || "our-campus"
  )})%20on%20KAMPYN%20platform.%0A%0ACollege%20Name%3A%20%0AContact%20Person%3A%20%0AContact%20Number%3A%20%0A%0AThank%20you!`;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#e0f5f0] via-[#f0f9f8] to-[#d3eeea] min-h-screen flex flex-col items-center justify-center p-4 py-16 md:py-24">
      {/* Decorative animated shapes in background */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ea199]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#01796f]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "3s" }}></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 2px 2px, #01796f 1px, transparent 0)",
        backgroundSize: "32px 32px"
      }}></div>

      <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">
        {/* KAMPYN Logo */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
          <Image
            src="https://res.cloudinary.com/dt45pu5mx/image/upload/v1754770229/FullLogo_Transparent_NoBuffer_1_fg1iux.png"
            alt="KAMPYN Logo"
            width={180}
            height={48}
            priority
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* Main Card */}
        <div className="w-full bg-white/75 backdrop-blur-lg border border-white/60 shadow-2xl rounded-3xl p-8 md:p-12 text-center flex flex-col items-center">
          
          {/* Animated Illustration Badge */}
          <div className="mb-6 w-20 h-20 bg-gradient-to-tr from-[#01796f] to-[#4ea199] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-800 tracking-tight mb-2">
            Campus Not Yet Onboarded
          </h1>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            Subdomain: {slug || "unknown"}
          </div>

          <p className="text-zinc-600 text-base md:text-lg max-w-lg mb-8 leading-relaxed">
            Welcome to KAMPYN! It looks like <span className="font-semibold text-zinc-900">{slug ? `${slug}.kampyn.com` : "this campus"}</span> is not yet registered or active on our smart campus network. 
          </p>

          {/* Onboarding Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left mb-10">
            {/* Student Welfare Option */}
            <div className="p-5 rounded-2xl bg-white/50 border border-zinc-100 hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#01796f] flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-800 text-sm mb-1.5">For Students & Faculty</h3>
              <p className="text-xs text-zinc-500 leading-normal">
                Reach out to your college student council or campus administration to request onboarding of KAMPYN.
              </p>
            </div>

            {/* University Admin Option */}
            <div className="p-5 rounded-2xl bg-white/50 border border-zinc-100 hover:border-teal-200 hover:bg-teal-50/20 transition-all duration-300">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#01796f] flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-zinc-800 text-sm mb-1.5">For College Administration</h3>
              <p className="text-xs text-zinc-500 leading-normal">
                Partner with us to provide food ordering, guest houses, and auditorium systems for your campus.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-[#01796f] to-[#4ea199] hover:from-[#005e56] hover:to-[#3e8e87] text-white font-semibold px-6 py-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <a href={mailtoUrl}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Contact KAMPYN Support
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold px-6 py-5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <Link href={baseDomainUrl}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Go to Main Website
              </Link>
            </Button>
          </div>

        </div>

        {/* Footer info */}
        <p className="mt-8 text-xs text-zinc-400 font-medium text-center">
          © {new Date().getFullYear()} KAMPYN. All rights reserved. Elevating the campus lifestyle.
        </p>
      </div>
    </div>
  );
}
