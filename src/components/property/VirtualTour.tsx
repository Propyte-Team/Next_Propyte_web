'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, Maximize2, RotateCcw, Move3D } from 'lucide-react';

interface VirtualTourProps {
  url: string;
  propertyName: string;
}

export default function VirtualTour({ url, propertyName }: VirtualTourProps) {
  const locale = useLocale();
  const [fullscreen, setFullscreen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showTour, setShowTour] = useState(false);

  return (
    <>
      {/* Inline preview / launch card */}
      {!showTour ? (
        <button
          onClick={() => setShowTour(true)}
          className="group relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-[#1A2F3F] to-[#5CE0D2] h-48 md:h-56 flex items-center justify-center cursor-pointer transition-all hover:shadow-lg"
        >
          {/* Animated 3D icon */}
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Move3D size={32} className="text-white" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {locale === 'es' ? 'Tour Virtual 360°' : 'Virtual Tour 360°'}
              </div>
              <div className="text-sm text-white/80 mt-0.5">
                {locale === 'es' ? 'Recorre la propiedad desde cualquier lugar' : 'Explore the property from anywhere'}
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
            <RotateCcw size={12} />
            360°
          </div>
        </button>
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden bg-[#0F1923]">
          {/* Loading state */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3 text-white">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm font-medium">
                  {locale === 'es' ? 'Cargando tour...' : 'Loading tour...'}
                </span>
              </div>
            </div>
          )}

          {/* Iframe */}
          <div className="relative aspect-[16/9]">
            <iframe
              src={url}
              title={`${propertyName} - Virtual Tour`}
              className="w-full h-full"
              allow="fullscreen; xr-spatial-tracking"
              allowFullScreen
              onLoad={() => setLoaded(true)}
            />
          </div>

          {/* Controls bar */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg text-white text-xs font-semibold transition-colors"
            >
              <Maximize2 size={12} />
              {locale === 'es' ? 'Pantalla completa' : 'Fullscreen'}
            </button>
            <button
              onClick={() => { setShowTour(false); setLoaded(false); }}
              className="w-8 h-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/90">
            <div className="flex items-center gap-3 text-white">
              <Move3D size={20} />
              <span className="font-semibold text-sm">
                {propertyName} — {locale === 'es' ? 'Tour Virtual 360°' : 'Virtual Tour 360°'}
              </span>
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1">
            <iframe
              src={url}
              title={`${propertyName} - Virtual Tour Fullscreen`}
              className="w-full h-full"
              allow="fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
