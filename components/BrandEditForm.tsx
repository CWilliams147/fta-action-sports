"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SCOUTING_STATUS_OPTIONS } from "@/lib/types/database";
import type { ScoutingStatusType } from "@/lib/types/database";

interface BrandEditFormProps {
  profileId: string;
  initial: {
    display_name: string;
    username: string;
    bio: string;
    banner_url: string | null;
    email_public: string;
    twitter: string;
    youtube: string;
    scouting_status: ScoutingStatusType | null;
  };
  onSaved: () => void;
}

export function BrandEditForm({ profileId, initial, onSaved }: BrandEditFormProps) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url ?? "");
  const [emailPublic, setEmailPublic] = useState(initial.email_public);
  const [twitter, setTwitter] = useState(initial.twitter);
  const [youtube, setYoutube] = useState(initial.youtube);
  const [scoutingStatus, setScoutingStatus] = useState<ScoutingStatusType | "">(initial.scouting_status ?? "");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      let finalBannerUrl = bannerUrl;
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop() ?? "jpg";
        const path = `${profileId}/banner.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("brands")
          .upload(path, bannerFile, { upsert: true });
        if (uploadError) {
          setMessage(uploadError.message);
          setLoading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("brands").getPublicUrl(path);
        finalBannerUrl = urlData.publicUrl;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          username: username.trim() || null,
          bio: bio || null,
          banner_url: finalBannerUrl || null,
          email_public: emailPublic.trim() || null,
          twitter: twitter.trim() || null,
          youtube: youtube.trim() || null,
          scouting_status: scoutingStatus || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      setBannerUrl(finalBannerUrl ?? "");
      setBannerFile(null);
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <label htmlFor="brand_display_name" className="block text-sm font-bold mb-1">
          Brand name
        </label>
        <input
          id="brand_display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="brand_username" className="block text-sm font-bold mb-1">
          Username (for Brand Hub URL)
        </label>
        <input
          id="brand_username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. acme-brand"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
        <p className="text-xs text-fta-black/70 mt-1">
          Your Brand Hub: /profile/{username || "username"}
        </p>
      </div>
      <div>
        <label htmlFor="brand_bio" className="block text-sm font-bold mb-1">
          Bio
        </label>
        <textarea
          id="brand_bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none resize-y"
        />
      </div>

      {/* Scouting Status – three options */}
      <div>
        <label className="block text-sm font-bold mb-2">Scouting status</label>
        <p className="text-xs text-fta-black/70 mb-2">
          Shown at the top of your Brand Hub so athletes know if it&apos;s worth sending a sponsor-me tape.
        </p>
        <div className="flex flex-wrap gap-2">
          {SCOUTING_STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 border-2 px-4 py-2 cursor-pointer has-[:checked]:ring-2 has-[:checked]:ring-fta-orange rounded-none ${opt.buttonClass}`}
            >
              <input
                type="radio"
                name="scouting_status"
                value={opt.value}
                checked={scoutingStatus === opt.value}
                onChange={() => setScoutingStatus(opt.value)}
                className="sr-only"
              />
              <span className="font-bold text-sm">{opt.displayLabel}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Banner – Hero 1200x400 */}
      <div>
        <label className="block text-sm font-bold mb-1">Banner (Hero image)</label>
        <p className="text-xs text-fta-black/70 mb-2">
          Recommended: 1200×400. Shown at top of Brand Hub with grayscale filter.
        </p>
        {bannerUrl && (
          <div className="mb-2 aspect-[3/1] max-h-[200px] border-2 border-fta-black overflow-hidden bg-fta-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerUrl}
              alt=""
              className="w-full h-full object-cover grayscale"
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none file:mr-2 file:border-2 file:border-fta-black file:bg-fta-orange file:px-3 file:py-1 file:font-bold file:text-fta-black"
        />
      </div>

      {/* Social & contact */}
      <div>
        <label htmlFor="brand_email" className="block text-sm font-bold mb-1">
          Public email
        </label>
        <input
          id="brand_email"
          type="email"
          value={emailPublic}
          onChange={(e) => setEmailPublic(e.target.value)}
          placeholder="contact@brand.com"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="brand_twitter" className="block text-sm font-bold mb-1">
          Twitter (handle or full URL)
        </label>
        <input
          id="brand_twitter"
          type="text"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
          placeholder="@brand or https://twitter.com/brand"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="brand_youtube" className="block text-sm font-bold mb-1">
          YouTube (handle or full URL)
        </label>
        <input
          id="brand_youtube"
          type="text"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
          placeholder="channel or https://youtube.com/@brand"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>

      {message && <p className="text-sm font-medium text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors disabled:opacity-50 rounded-none"
      >
        {loading ? "Saving…" : "Save Brand Hub"}
      </button>
    </form>
  );
}
