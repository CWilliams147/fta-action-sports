"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CREATIVE_SPECIALTIES, CREATIVE_EQUIPMENT_OPTIONS } from "@/lib/types/database";

interface CreativeEditFormProps {
  profileId: string;
  initial: {
    display_name: string;
    username: string;
    bio: string;
    home_town: string;
    equipment_list: string[];
    specialties: string[];
    day_rate: string;
    youtube_portfolio: string;
    vimeo_portfolio: string;
    behance_portfolio: string;
  };
  onSaved: () => void;
}

export function CreativeEditForm({ profileId, initial, onSaved }: CreativeEditFormProps) {
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [username, setUsername] = useState(initial.username);
  const [bio, setBio] = useState(initial.bio);
  const [homeTown, setHomeTown] = useState(initial.home_town);
  const [equipmentList, setEquipmentList] = useState<string[]>(initial.equipment_list);
  const [specialties, setSpecialties] = useState<string[]>(initial.specialties);
  const [dayRate, setDayRate] = useState(initial.day_rate);
  const [youtubePortfolio, setYoutubePortfolio] = useState(initial.youtube_portfolio);
  const [vimeoPortfolio, setVimeoPortfolio] = useState(initial.vimeo_portfolio);
  const [behancePortfolio, setBehancePortfolio] = useState(initial.behance_portfolio);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  function toggleEquipment(item: string) {
    setEquipmentList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  function toggleSpecialty(item: string) {
    setSpecialties((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          username: username.trim() || null,
          bio: bio || null,
          home_town: homeTown || null,
          equipment_list: equipmentList,
          specialties: specialties,
          day_rate: dayRate ? parseFloat(dayRate) : null,
          youtube_portfolio: youtubePortfolio.trim() || null,
          vimeo_portfolio: vimeoPortfolio.trim() || null,
          behance_portfolio: behancePortfolio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div>
        <label htmlFor="creative_display_name" className="block text-sm font-bold mb-1">
          Name
        </label>
        <input
          id="creative_display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="creative_username" className="block text-sm font-bold mb-1">
          Username (for profile URL)
        </label>
        <input
          id="creative_username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. jane-filmer"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
        <p className="text-xs text-fta-black/70 mt-1">Profile: /profile/{username || "username"}</p>
      </div>
      <div>
        <label htmlFor="creative_bio" className="block text-sm font-bold mb-1">
          Bio
        </label>
        <textarea
          id="creative_bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none resize-y"
        />
      </div>
      <div>
        <label htmlFor="creative_home_town" className="block text-sm font-bold mb-1">
          Location (home town / base)
        </label>
        <input
          id="creative_home_town"
          type="text"
          value={homeTown}
          onChange={(e) => setHomeTown(e.target.value)}
          placeholder="e.g. Los Angeles, CA"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label className="block text-sm font-bold mb-2">Specialties (Video, Photo, Drone)</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_SPECIALTIES.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none cursor-pointer"
            >
              <input
                type="checkbox"
                checked={specialties.includes(item)}
                onChange={() => toggleSpecialty(item)}
                className="sr-only"
              />
              <span className="font-bold">{item}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold mb-2">Equipment</label>
        <div className="flex flex-wrap gap-2">
          {CREATIVE_EQUIPMENT_OPTIONS.map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 border-2 border-fta-black px-4 py-2 has-[:checked]:bg-fta-orange has-[:checked]:border-fta-orange rounded-none cursor-pointer"
            >
              <input
                type="checkbox"
                checked={equipmentList.includes(item)}
                onChange={() => toggleEquipment(item)}
                className="sr-only"
              />
              <span className="font-bold">{item}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="creative_day_rate" className="block text-sm font-bold mb-1">
          Day rate (optional)
        </label>
        <input
          id="creative_day_rate"
          type="text"
          inputMode="decimal"
          value={dayRate}
          onChange={(e) => setDayRate(e.target.value)}
          placeholder="e.g. 500"
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="creative_youtube" className="block text-sm font-bold mb-1">
          YouTube (portfolio / channel URL)
        </label>
        <input
          id="creative_youtube"
          type="url"
          value={youtubePortfolio}
          onChange={(e) => setYoutubePortfolio(e.target.value)}
          placeholder="https://youtube.com/..."
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="creative_vimeo" className="block text-sm font-bold mb-1">
          Vimeo (portfolio URL)
        </label>
        <input
          id="creative_vimeo"
          type="url"
          value={vimeoPortfolio}
          onChange={(e) => setVimeoPortfolio(e.target.value)}
          placeholder="https://vimeo.com/..."
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      <div>
        <label htmlFor="creative_behance" className="block text-sm font-bold mb-1">
          Behance (portfolio URL)
        </label>
        <input
          id="creative_behance"
          type="url"
          value={behancePortfolio}
          onChange={(e) => setBehancePortfolio(e.target.value)}
          placeholder="https://behance.net/..."
          className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-medium rounded-none"
        />
      </div>
      {message && <p className="text-sm font-medium text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 border-2 border-fta-black bg-fta-orange text-fta-black font-bold hover:bg-fta-paper hover:border-fta-orange transition-colors disabled:opacity-50 rounded-none"
      >
        {loading ? "Saving…" : "Save Creative Profile"}
      </button>
    </form>
  );
}
