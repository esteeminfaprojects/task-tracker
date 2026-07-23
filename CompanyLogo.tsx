import React from "react";

interface CompanyLogoProps {
  variant?: "full" | "header" | "login" | "footer" | "badge";
  theme?: "dark" | "light";
  className?: string;
  showTagline?: boolean;
}

export default function CompanyLogo({
  variant = "full",
  theme = "dark",
  className = "",
  showTagline = true,
}: CompanyLogoProps) {
  const isDark = theme === "dark";
  const mainTextColor = isDark ? "text-slate-100" : "text-slate-900";
  const redColor = isDark ? "text-red-500" : "text-red-600";
  const redHex = isDark ? "#ef4444" : "#dc2626";

  if (variant === "header") {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Brand Graphic Symbol */}
        <div className="h-10 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-black/40 group hover:border-red-500/40 transition-all">
          <svg viewBox="0 0 180 50" className="h-7 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* ESTEEM Stylized SVG Vector */}
            <text x="0" y="30" fontFamily="sans-serif" fontWeight="900" fontSize="32" letterSpacing="2" fill={isDark ? "#f8fafc" : "#0f172a"}>
              ESTEEM
            </text>
            <text x="2" y="46" fontFamily="sans-serif" fontWeight="700" fontSize="13" letterSpacing="0.5" fill={redHex}>
              InfraProjects Pvt. Ltd.
            </text>
          </svg>
        </div>
        <div className="hidden sm:block leading-tight">
          <div className={`font-black tracking-widest text-sm uppercase ${mainTextColor} flex items-center gap-1.5`}>
            ESTEEM
            <span className="text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20 lowercase tracking-normal">
              official
            </span>
          </div>
          <div className={`text-[10px] font-bold tracking-tight ${redColor}`}>
            InfraProjects Pvt. Ltd.
          </div>
        </div>
      </div>
    );
  }

  if (variant === "login") {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="bg-slate-950/90 border border-slate-800/90 p-4 sm:p-5 rounded-2xl shadow-xl shadow-black/60 backdrop-blur-md mb-2 max-w-[280px] sm:max-w-[320px] w-full flex flex-col items-center justify-center hover:border-red-500/30 transition-all">
          <svg viewBox="0 0 320 85" className="w-full h-auto max-h-16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="45" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="48" letterSpacing="4" fill={isDark ? "#ffffff" : "#0f172a"}>
              ESTEEM
            </text>
            <text x="50%" y="74" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="19" letterSpacing="1" fill={redHex}>
              InfraProjects Pvt. Ltd.
            </text>
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <span className={`font-black tracking-wider text-xs ${mainTextColor}`}>ESTEEM</span>
        <span className={`text-[11px] font-bold ${redColor}`}>InfraProjects Pvt. Ltd.</span>
      </div>
    );
  }

  // Default "full" or "badge" variant
  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className={`font-black tracking-widest leading-none text-xl ${mainTextColor}`}>
        ESTEEM
      </div>
      {showTagline && (
        <div className={`text-xs font-bold tracking-tight mt-1 ${redColor}`}>
          InfraProjects Pvt. Ltd.
        </div>
      )}
    </div>
  );
}
