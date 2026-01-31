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
  snow_style: SnowStyleType | null;
  skate_style: SkateStyleType | null;
  foot_forward: FootForwardType | null;
  style: StyleType | null;
  discipline: DisciplineType | null;
  verified: boolean;
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
