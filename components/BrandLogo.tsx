import Image from "next/image";
import Link from "next/link";

const FULL = "/branding/fta-full-logo.png";
const ICON = "/branding/fta-icon.png";

/** Default: compact (fallback only). Prefer passing className or using exported presets. */
const DEFAULT_FULL_CLASS =
  "h-8 w-auto max-w-[min(100%,280px)] object-contain object-left md:h-10 md:max-w-[320px]";

/** Desktop top nav — large enough to read on first glance. */
export const BRAND_LOGO_NAV_CLASS =
  "h-10 w-auto max-w-[min(100vw-2rem,380px)] sm:h-11 md:h-12 md:max-w-[min(100vw-3rem,440px)] object-contain object-left";

/** Map page header — matches nav prominence on mobile + desktop. */
export const BRAND_LOGO_MAP_HEADER_CLASS =
  "h-11 w-auto max-w-[min(100%,min(100vw-2rem,420px))] sm:h-12 md:h-14 md:max-w-[min(100vw-2rem,480px)] object-contain object-left";

/** Full wordmark: FTA + Find The Adventure (transparent PNG). */
export function BrandLogoFull({
  className,
  priority = false,
}: {
  className?: string;
  /** Use on LCP / above-the-fold */
  priority?: boolean;
}) {
  return (
    <Image
      src={FULL}
      alt="FTA — Find The Adventure"
      width={1376}
      height={768}
      sizes="(max-width: 768px) 100vw, 560px"
      className={className ?? DEFAULT_FULL_CLASS}
      priority={priority}
    />
  );
}

export function BrandLogoFullLink({
  href = "/",
  className = "",
  logoClassName,
  priority = false,
}: {
  href?: string;
  className?: string;
  /** Classes for the image (size, max-width). Prefer BRAND_LOGO_NAV_CLASS or BRAND_LOGO_MAP_HEADER_CLASS. */
  logoClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-fta-orange focus-visible:ring-offset-2 focus-visible:ring-offset-fta-paper ${className}`}
    >
      <BrandLogoFull priority={priority} className={logoClassName} />
    </Link>
  );
}

/** Orange “A” arrow mark — favicon-sized uses; pair with visible text for meaning. */
export function BrandLogoIcon({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={ICON}
      alt=""
      width={size}
      height={size}
      className={`object-contain ${className}`}
      aria-hidden
    />
  );
}
