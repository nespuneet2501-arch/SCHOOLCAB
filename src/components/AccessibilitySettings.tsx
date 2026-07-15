import React, { useState, useEffect } from 'react';
import { Sliders, Type, Check, RefreshCw } from 'lucide-react';

export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  sidebarBg: string;
}

export const THEME_PRESETS: ColorTheme[] = [
  {
    name: "GD Goenka Blue & White",
    primary: "#0b3c8c",
    secondary: "#ffffff",
    accent: "#3b82f6",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "text-blue-600",
    sidebarBg: "bg-blue-950"
  },
  {
    name: "Classic Navy & Gold",
    primary: "#0b3c8c",
    secondary: "#fbbf24",
    accent: "#1e3a8a",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "text-amber-600",
    sidebarBg: "bg-slate-950"
  },
  {
    name: "Emerald Prestige",
    primary: "#064e3b",
    secondary: "#10b981",
    accent: "#047857",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "text-emerald-600",
    sidebarBg: "bg-emerald-950"
  },
  {
    name: "Crimson Royal",
    primary: "#7f1d1d",
    secondary: "#f43f5e",
    accent: "#991b1b",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    badgeText: "text-rose-600",
    sidebarBg: "bg-rose-950"
  },
  {
    name: "Slate & Teal",
    primary: "#0f172a",
    secondary: "#2dd4bf",
    accent: "#0d9488",
    badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
    badgeText: "text-teal-600",
    sidebarBg: "bg-slate-950"
  }
];

interface AccessibilitySettingsProps {
  onThemeChange: (theme: ColorTheme) => void;
  onFontScaleChange: (scale: number) => void;
  currentThemeName: string;
  currentFontScale: number;
}

export default function AccessibilitySettings({
  onThemeChange,
  onFontScaleChange,
  currentThemeName,
  currentFontScale
}: AccessibilitySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border border-white/10 flex items-center justify-center transition-all duration-300 hover:rotate-45 relative group focus:outline-none focus:ring-2 focus:ring-amber-400"
        title="App Customizer (Themes & Fonts)"
      >
        <Sliders className="w-5 h-5 text-amber-400" />
        <span className="absolute right-14 bg-slate-900 text-[10px] text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap shadow-md border border-white/5">
          Appearance Settings
        </span>
      </button>

      {/* Popover Settings Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>App Interface Customizer</span>
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Close
            </button>
          </div>

          {/* Color Themes Section */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Active Color Theme
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((t) => {
                const isSelected = t.name === currentThemeName;
                return (
                  <button
                    key={t.name}
                    onClick={() => onThemeChange(t)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-50 shadow-xs' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: t.primary }} />
                        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: t.secondary }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate block">
                        {t.name.split(' ')[0]}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 bg-slate-900 text-amber-400 rounded-full p-0.5">
                        <Check className="w-2 h-2" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Scaling Section */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Adjust Font Scale
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                {currentFontScale}%
              </span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
              <Type className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-grow flex items-center justify-between gap-1">
                <button
                  onClick={() => onFontScaleChange(Math.max(90, currentFontScale - 10))}
                  disabled={currentFontScale <= 90}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 active:scale-95 text-xs text-slate-700 font-bold disabled:opacity-40 flex items-center justify-center transition shadow-xs"
                >
                  A-
                </button>
                
                <span className="text-xs text-slate-500 font-medium">
                  {currentFontScale === 100 ? 'Normal' : currentFontScale > 100 ? 'Large' : 'Compact'}
                </span>

                <button
                  onClick={() => onFontScaleChange(Math.min(140, currentFontScale + 10))}
                  disabled={currentFontScale >= 140}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 active:scale-95 text-xs text-slate-700 font-bold disabled:opacity-40 flex items-center justify-center transition shadow-xs"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center font-medium">
            Aesthetic updates persist dynamically on your device.
          </p>

        </div>
      )}

    </div>
  );
}
