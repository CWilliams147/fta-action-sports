/**
 * FTA Action Sports – DB types for profiles and dynamic athlete sport logic.
 * .cursorrules: Board (Skateboard, Surf, Snowboard) = Stance; Skiing = Primary Style; Bike = Foot Forward; Moto = Discipline.
 */

export type AccountType = "athlete" | "brand";

export type SportCategory = "board" | "bike" | "motor_other";

/** Board (Skateboard, Surf, Snowboard): Stance = Regular | Goofy */
export type StanceType = "regular" | "goofy";

/** Skiing & Snowboarding: Snow style (Park/Pipe, Big Mountain, Backcountry) */
export type SnowStyleType = "park_pipe" | "big_mountain" | "backcountry";

/** Skateboard: Style (Street, Vert, Park, Freestyle, Downhill) */
export type SkateStyleType = "street" | "vert" | "park" | "freestyle" | "downhill";

/** Bike (BMX, MTB): Foot Forward = Left | Right */
export type FootForwardType = "left" | "right";

/** Moto: Discipline = Freestyle | Racing | Enduro */
export type DisciplineType = "freestyle" | "racing" | "enduro";

/** Legacy motor/other style (kept for backward compat if needed) */
export type StyleType = "park" | "street" | "dirt" | "flatland";

/** Brand scouting status for Brand Hub */
export type ScoutingStatusType = "actively_scouting" | "monitoring" | "roster_full";

export interface Profile {
  id: string;
  account_type: AccountType;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  home_town: string | null;
  created_at: string;
  updated_at: string;
  sport_category: SportCategory | null;
  sport_name: string | null;
  stance: StanceType | null;
  snow_styles: SnowStyleType[] | null;
  skate_styles: SkateStyleType[] | null;
  foot_forward: FootForwardType | null;
  style: StyleType | null;
  disciplines: DisciplineType[] | null;
  verified: boolean;
  /** Brand-only */
  banner_url: string | null;
  email_public: string | null;
  twitter: string | null;
  youtube: string | null;
  scouting_status: ScoutingStatusType | null;
}

/** Clip Catalog: one clip per row, linked to profile */
export interface Clip {
  id: string;
  profile_id: string;
  video_url: string;
  thumbnail_url: string | null;
  trick_name: string | null;
  location: string | null;
  spot_name: string | null;
  created_at: string;
}

/** Daps: one row per user per clip (user can only dap a clip once) */
export interface Dap {
  id: string;
  user_id: string;
  clip_id: string;
  created_at: string;
}

/** Profile Daps (Athlete Reputation): one row per voter per athlete (voter can only dap an athlete once) */
export interface ProfileDap {
  id: string;
  voter_id: string;
  athlete_id: string;
  created_at: string;
}

/** Brand Watchlist: brand_id + athlete_id, unique per pair */
export interface Watchlist {
  id: string;
  brand_id: string;
  athlete_id: string;
  created_at: string;
}

/** Scout feed: athlete card with total daps, latest clip, and watchlist status */
export interface ScoutAthlete {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  sport_name: string | null;
  home_town: string | null;
  stance: StanceType | null;
  foot_forward: FootForwardType | null;
  athlete_daps_count: number;
  latest_clip: { id: string; video_url: string; thumbnail_url: string | null } | null;
  on_watchlist: boolean;
}

/** Trending: top athletes by clip daps in last 7 days */
export interface TrendingAthlete {
  id: string;
  display_name: string | null;
  username: string | null;
  sport_name: string | null;
  clip_daps_7d: number;
}

/** Discovery feed: clip with athlete display name and daps info */
export interface DiscoveryClip {
  id: string;
  profile_id: string;
  video_url: string;
  thumbnail_url: string | null;
  trick_name: string | null;
  location: string | null;
  spot_name: string | null;
  created_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
  daps_count: number;
  user_has_dapped: boolean;
}

/** Spot Map: type is sport-specific riding style (stored as TEXT). */
/** Spot: map location with name, sport, type (style), lat/lng, description */
export interface Spot {
  id: string;
  name: string;
  sport: string;
  type: string;
  lat: number;
  lng: number;
  description: string | null;
  created_at: string;
}

/** Spot style options per sport (riding styles from profile logic). */
export const SPOT_STYLE_OPTIONS_BY_SPORT: Record<string, { value: string; label: string }[]> = {
  Skateboard: [
    { value: "street", label: "Street" },
    { value: "vert", label: "Vert" },
    { value: "park", label: "Park" },
    { value: "freestyle", label: "Freestyle" },
    { value: "downhill", label: "Downhill" },
  ],
  Snowboard: [
    { value: "park_pipe", label: "Park/Pipe" },
    { value: "big_mountain", label: "Big Mountain" },
    { value: "backcountry", label: "Backcountry" },
  ],
  Skiing: [
    { value: "park_pipe", label: "Park/Pipe" },
    { value: "big_mountain", label: "Big Mountain" },
    { value: "backcountry", label: "Backcountry" },
  ],
  Surf: [
    { value: "beach", label: "Beach" },
    { value: "point", label: "Point" },
    { value: "reef", label: "Reef" },
    { value: "park", label: "Park" },
    { value: "street", label: "Street" },
  ],
  BMX: [
    { value: "park", label: "Park" },
    { value: "street", label: "Street" },
    { value: "dirt", label: "Dirt" },
    { value: "flatland", label: "Flatland" },
    { value: "diy", label: "DIY" },
  ],
  MTB: [
    { value: "park", label: "Park" },
    { value: "trail", label: "Trail" },
    { value: "downhill", label: "Downhill" },
    { value: "enduro", label: "Enduro" },
    { value: "dirt", label: "Dirt" },
  ],
  Moto: [
    { value: "freestyle", label: "Freestyle" },
    { value: "racing", label: "Racing" },
    { value: "enduro", label: "Enduro" },
  ],
};

/** Resolve spot type value to display label for a given sport. */
export function getSpotTypeLabel(sport: string, typeValue: string): string {
  const options = SPOT_STYLE_OPTIONS_BY_SPORT[sport];
  if (options) {
    const found = options.find((o) => o.value === typeValue);
    if (found) return found.label;
  }
  return typeValue.charAt(0).toUpperCase() + typeValue.slice(1).replace(/_/g, " ");
}

/** Check-in: user checked in at spot at created_at (filter for latest per user in app) */
export interface CheckIn {
  id: string;
  user_id: string;
  spot_id: string;
  created_at: string;
}

/** Spot with computed analytics for Spot Card */
export interface SpotWithStats extends Spot {
  active_now: number;
  weekly_avg: number;
  heating_up: boolean;
  recent_check_ins: { user_id: string; display_name: string | null; avatar_url: string | null }[];
}

/** Sport options: name + category. Stance = Skateboard, Surf, Snowboard. Snow style = Skiing, Snowboard. */
export const SPORT_OPTIONS: { category: SportCategory; name: string }[] = [
  { category: "board", name: "Skateboard" },
  { category: "board", name: "Surf" },
  { category: "board", name: "Snowboard" },
  { category: "board", name: "Skiing" },
  { category: "bike", name: "BMX" },
  { category: "bike", name: "MTB" },
  { category: "motor_other", name: "Moto" },
];

/** Board (Skateboard, Surf, Snowboard): Stance */
export const STANCE_OPTIONS: { value: StanceType; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "goofy", label: "Goofy" },
];

/** Skiing & Snowboarding: Snow style */
export const SNOW_STYLE_OPTIONS: { value: SnowStyleType; label: string }[] = [
  { value: "park_pipe", label: "Park/Pipe" },
  { value: "big_mountain", label: "Big Mountain" },
  { value: "backcountry", label: "Backcountry" },
];

/** Skateboard: Style */
export const SKATE_STYLE_OPTIONS: { value: SkateStyleType; label: string }[] = [
  { value: "street", label: "Street" },
  { value: "vert", label: "Vert" },
  { value: "park", label: "Park" },
  { value: "freestyle", label: "Freestyle" },
  { value: "downhill", label: "Downhill" },
];

/** Bike (BMX, MTB): Foot Forward */
export const FOOT_FORWARD_OPTIONS: { value: FootForwardType; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

/** Moto: Discipline */
export const DISCIPLINE_OPTIONS: { value: DisciplineType; label: string }[] = [
  { value: "freestyle", label: "Freestyle" },
  { value: "racing", label: "Racing" },
  { value: "enduro", label: "Enduro" },
];

/** Brand scouting status: display label + Tailwind-style for Brand Hub */
export const SCOUTING_STATUS_OPTIONS: {
  value: ScoutingStatusType;
  label: string;
  displayLabel: string;
  /** Brutalist: orange = actively, grey = monitoring, black = roster full */
  buttonClass: string;
}[] = [
  { value: "actively_scouting", label: "Actively scouting", displayLabel: "ACTIVELY SCOUTING", buttonClass: "border-fta-orange bg-fta-orange text-fta-black" },
  { value: "monitoring", label: "Monitoring", displayLabel: "MONITORING", buttonClass: "border-fta-black bg-[#9ca3af] text-fta-black" },
  { value: "roster_full", label: "Roster full", displayLabel: "ROSTER FULL", buttonClass: "border-fta-black bg-fta-black text-fta-paper" },
];

/** Whether this sport name uses Stance (Regular/Goofy) */
export function sportUsesStance(sportName: string): boolean {
  return ["Skateboard", "Surf", "Snowboard"].includes(sportName);
}

/** Whether this sport name uses Snow style (Skiing, Snowboarding) */
export function sportUsesSnowStyle(sportName: string): boolean {
  return sportName === "Skiing" || sportName === "Snowboard";
}

/** Whether this sport name uses Skate Style (Skateboard) */
export function sportUsesSkateStyle(sportName: string): boolean {
  return sportName === "Skateboard";
}

/** Whether this sport name uses Foot Forward */
export function sportUsesFootForward(sportName: string): boolean {
  return ["BMX", "MTB"].includes(sportName);
}

/** Whether this sport name uses Discipline (Moto) */
export function sportUsesDiscipline(sportName: string): boolean {
  return sportName === "Moto";
}

export const STYLE_OPTIONS: { value: StyleType; label: string }[] = [
  { value: "park", label: "Park" },
  { value: "street", label: "Street" },
  { value: "dirt", label: "Dirt" },
  { value: "flatland", label: "Flatland" },
];
