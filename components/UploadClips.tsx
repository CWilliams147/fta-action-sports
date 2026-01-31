"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Clip } from "@/lib/types/database";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface UploadClipsProps {
  profileId: string;
  onUploaded?: (clip: Clip) => void;
}

export function UploadClips({ profileId, onUploaded }: UploadClipsProps) {
  const [trickName, setTrickName] = useState("");
  const [locationSpot, setLocationSpot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "Select a video file." });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setMessage({ type: "error", text: `File must be under ${MAX_FILE_SIZE_MB} MB.` });
      return;
    }
    setUploading(true);
    setMessage(null);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => (p >= 85 ? p : p + Math.random() * 8 + 2));
    }, 400);
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("clips").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
      if (uploadError) {
        setProgress(0);
        const isSizeError =
          /exceeded|maximum allowed size|too large|file size/i.test(uploadError.message);
        setMessage({
          type: "error",
          text: isSizeError
            ? `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
            : uploadError.message,
        });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("clips").getPublicUrl(path);
      const videoUrl = urlData.publicUrl;
      const { data: clip, error: insertError } = await supabase
        .from("clips")
        .insert({
          profile_id: profileId,
          video_url: videoUrl,
          trick_name: trickName.trim() || null,
          location: locationSpot.trim() || null,
          spot_name: locationSpot.trim() || null,
        })
        .select()
        .single();
      if (insertError) {
        setProgress(0);
        setMessage({ type: "error", text: insertError.message });
        setUploading(false);
        return;
      }
      setTrickName("");
      setLocationSpot("");
      setFile(null);
      setMessage({ type: "success", text: "Clip uploaded." });
      onUploaded?.(clip as Clip);
      setTimeout(() => setProgress(0), 800);
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(0);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed." });
    }
    setUploading(false);
  }

  return (
    <section className="mt-10 pt-10 border-t-2 border-fta-black">
      <h2 className="text-xl font-bold tracking-tight border-b-2 border-fta-orange pb-2 inline-block mb-6">
        Upload New Clip
      </h2>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label htmlFor="clip-trick" className="block text-sm font-bold mb-1 text-fta-orange">
            Trick Name
          </label>
          <input
            id="clip-trick"
            type="text"
            value={trickName}
            onChange={(e) => setTrickName(e.target.value)}
            placeholder="e.g. Kickflip, 360"
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        <div>
          <label htmlFor="clip-location" className="block text-sm font-bold mb-1">
            Location / Spot
          </label>
          <input
            id="clip-location"
            type="text"
            value={locationSpot}
            onChange={(e) => setLocationSpot(e.target.value)}
            placeholder="e.g. The Berrics, local park, city"
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
          />
        </div>
        <div>
          <label htmlFor="clip-file" className="block text-sm font-bold mb-1">
            Video file <span className="font-normal text-fta-black/70">(max {MAX_FILE_SIZE_MB} MB)</span>
          </label>
          <input
            id="clip-file"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
            className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none file:mr-2 file:border-2 file:border-fta-black file:bg-fta-orange file:px-3 file:py-1 file:font-bold file:text-fta-black file:rounded-none disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-fta-black/70 font-medium">
            MP4, WebM, or QuickTime. Maximum allowed size: {MAX_FILE_SIZE_MB} MB.
          </p>
        </div>
        {uploading && (
          <div className="space-y-1">
            <div className="h-2 border-2 border-fta-black bg-fta-paper overflow-hidden rounded-none">
              <div
                className="h-full bg-fta-orange transition-all duration-300 ease-out rounded-none"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs font-bold text-fta-black/80">
              {progress >= 100 ? "Finishing…" : "Uploading…"}
            </p>
          </div>
        )}
        {message && (
          <p className={`text-sm font-bold ${message.type === "error" ? "text-red-600" : "text-fta-orange"}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-3 border-2 border-fta-orange bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-black transition-colors disabled:opacity-50 rounded-none"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>
    </section>
  );
}
