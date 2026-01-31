"use client";

import { useState } from "react";
import type { Clip } from "@/lib/types/database";

interface ClipCatalogProps {
  clips: Clip[];
}

export function ClipCatalog({ clips }: ClipCatalogProps) {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  if (clips.length === 0) return null;

  return (
    <>
      <section className="w-full max-w-4xl mt-10 pt-10 border-t-2 border-fta-black">
        <h2 className="text-xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block mb-6">
          Clip Catalog
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <button
              key={clip.id}
              type="button"
              onClick={() => setSelectedClip(clip)}
              className="w-full border-2 border-fta-black bg-fta-paper overflow-hidden text-left rounded-none hover:border-fta-orange focus:border-fta-orange focus:outline-none"
            >
              <div className="aspect-video bg-fta-black relative">
                {clip.thumbnail_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={clip.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-fta-paper/50">
                    <span className="text-4xl" aria-hidden>▶</span>
                  </div>
                )}
              </div>
              <div className="p-2 border-t-2 border-fta-black">
                {clip.trick_name ? (
                  <p className="text-sm font-bold text-fta-orange truncate">{clip.trick_name}</p>
                ) : (
                  <p className="text-sm font-bold text-fta-black/70 truncate">Clip</p>
                )}
                {(clip.spot_name || clip.location) && (
                  <p className="text-xs text-fta-black/60 truncate">
                    {clip.spot_name || clip.location}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-fta-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
          onClick={() => setSelectedClip(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedClip(null)}
            className="absolute top-4 right-4 w-10 h-10 border-2 border-fta-paper bg-fta-paper text-fta-black font-bold hover:bg-fta-orange hover:border-fta-orange rounded-none z-10"
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="w-full max-w-3xl border-2 border-fta-orange bg-fta-black overflow-hidden rounded-none"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedClip.video_url}
              controls
              autoPlay
              className="w-full aspect-video"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="p-4 border-t-2 border-fta-orange bg-fta-paper">
              {selectedClip.trick_name && (
                <p className="font-bold text-fta-orange">{selectedClip.trick_name}</p>
              )}
              {(selectedClip.spot_name || selectedClip.location) && (
                <p className="text-sm text-fta-black/80">
                  {selectedClip.spot_name || selectedClip.location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
