'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Play, X, Maximize2, Volume2 } from 'lucide-react';
import Image from 'next/image';

interface VideoPlayerProps {
  url: string;
  propertyName: string;
  thumbnail?: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ url, propertyName, thumbnail }: VideoPlayerProps) {
  const locale = useLocale();
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const ytId = getYouTubeId(url);
  const thumbUrl = thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  return (
    <>
      {/* Inline player */}
      {!playing ? (
        <button
          onClick={() => setPlaying(true)}
          className="group relative w-full rounded-xl overflow-hidden bg-[#0F1923] h-48 md:h-56 cursor-pointer transition-all hover:shadow-lg"
        >
          {/* Thumbnail */}
          {thumbUrl && (
            <Image
              src={thumbUrl}
              alt={`${propertyName} video`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
            />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/35 transition-all">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Play size={22} className="text-[#2C2C2C] ml-1" fill="#2C2C2C" />
              </div>
            </div>
          </div>

          {/* Label */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
            <Volume2 size={16} className="text-white/80" />
            <span className="text-sm font-bold">
              {locale === 'es' ? 'Video del proyecto' : 'Project video'}
            </span>
          </div>

          {/* Duration badge placeholder */}
          <div className="absolute bottom-4 right-4 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-semibold">
            2:30
          </div>
        </button>
      ) : (
        <div className="relative w-full rounded-xl overflow-hidden bg-black">
          <div className="relative aspect-[16/9]">
            <iframe
              src={`${url}?autoplay=1&rel=0&modestbranding=1`}
              title={`${propertyName} - Video`}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-lg text-white text-xs font-semibold transition-colors"
            >
              <Maximize2 size={12} />
              {locale === 'es' ? 'Pantalla completa' : 'Fullscreen'}
            </button>
            <button
              onClick={() => setPlaying(false)}
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
              <Play size={18} fill="white" />
              <span className="font-semibold text-sm">
                {propertyName} — {locale === 'es' ? 'Video' : 'Video'}
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
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-[90vw] aspect-[16/9]">
              <iframe
                src={`${url}?autoplay=1&rel=0&modestbranding=1`}
                title={`${propertyName} - Video Fullscreen`}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
