/* РРєРѕРЅРєРё РІ СЃС‚РёР»Рµ РєР°СЂС‚С‹: РїР»РѕС‚РЅС‹Р№ РєРѕРЅС‚СѓСЂ, РїР»РѕСЃРєР°СЏ Р·Р°Р»РёРІРєР°.
   Р¦РІРµС‚ Р·Р°Р»РёРІРєРё Р±РµСЂС‘С‚СЃСЏ РёР· CSS: .ic-fill вЂ” С†РІРµС‚ СЂР°Р·РґРµР»Р° (--sec), .ic-hi вЂ” Р¶С‘Р»С‚С‹Р№,
   .ic-berry вЂ” РєРѕСЂР°Р»Р»РѕРІС‹Р№, .ic-paper вЂ” Р±РµР»С‹Р№. */

import type { IconKey } from "@/data/encyclopedia-schema";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MapIcon() {
  return (
    <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
      <path className="ic-fill" {...S} d="M6 12 L18 7 L30 12 L42 7 V36 L30 41 L18 36 L6 41 Z" />
      <path {...S} d="M18 7 V36 M30 12 V41" />
    </svg>
  );
}

export function BookIcon() {
  return (
    <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
      <path className="ic-paper" {...S} d="M6 11 Q15 6 24 12 Q33 6 42 11 V39 Q33 34 24 40 Q15 34 6 39 Z" />
      <path {...S} d="M24 12 V40 M11 17 Q15 15.5 19 17.5 M11 23 Q15 21.5 19 23.5 M29 17.5 Q33 15.5 37 17" />
    </svg>
  );
}

/** Р—РЅР°С‡РѕРє СЂР°Р·РґРµР»Р°. РќРѕРІС‹Р№ Р·РЅР°С‡РѕРє: РґРѕР±Р°РІСЊС‚Рµ case Р·РґРµСЃСЊ Рё РЅР°Р·РІР°РЅРёРµ РІ ICONS (src/data/encyclopedia.ts) */
export function SectionIcon({ icon }: { icon: IconKey }) {
  switch (icon) {
    case "face":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-fill" {...S} d="M13 18 L10 6 L21 12 M35 18 L38 6 L27 12" />
          <circle className="ic-fill" {...S} cx="24" cy="27" r="15" />
          <circle cx="18.5" cy="25" r="2.3" fill="currentColor" />
          <circle cx="29.5" cy="25" r="2.3" fill="currentColor" />
          <path {...S} d="M19 32 Q24 36.5 29 32" />
        </svg>
      );
    case "mountain":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-fill" {...S} d="M4 41 L18 17 L25 28 L31 20 L44 41 Z" />
          <path className="ic-hi" {...S} d="M18 17 V5 L27 8.5 L18 12" />
          <path {...S} d="M13 33 L17 29 M33 30 L36 34" />
        </svg>
      );
    case "berries":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path {...S} d="M24 24 Q22 16 14 12" />
          <path className="ic-fill" {...S} d="M24 22 C24 11 32 6 42 6 C42 17 34 22 24 22 Z" />
          <circle className="ic-berry" {...S} cx="17" cy="31" r="8" />
          <circle className="ic-berry" {...S} cx="31" cy="33" r="7" />
          <circle className="ic-berry" {...S} cx="23" cy="41" r="5" />
        </svg>
      );
    case "bug":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <ellipse className="ic-paper" {...S} cx="14" cy="19" rx="10" ry="6" transform="rotate(-28 14 19)" />
          <ellipse className="ic-paper" {...S} cx="34" cy="19" rx="10" ry="6" transform="rotate(28 34 19)" />
          <path {...S} d="M21 12 L17 4 M27 12 L31 4" />
          <ellipse className="ic-fill" {...S} cx="24" cy="30" rx="7.5" ry="12" />
          <circle className="ic-hi" {...S} cx="24" cy="15" r="5" />
          <path {...S} d="M17.5 28 H30.5 M18 34 H30" />
        </svg>
      );
    case "flask":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-paper" {...S} d="M19 9 H29 V18 L38 34 Q41 43 32 43 H16 Q7 43 10 34 L19 18 Z" />
          <path className="ic-fill" {...S} d="M12.5 30 H35.5 L37 33.5 Q39.5 41 32 41 H16 Q8.5 41 11 33.5 Z" />
          <rect className="ic-hi" {...S} x="17" y="4" width="14" height="6" rx="2" />
          <circle cx="21" cy="25" r="1.8" fill="currentColor" />
          <circle cx="27" cy="21" r="1.4" fill="currentColor" />
        </svg>
      );
    case "book":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-fill" {...S} d="M6 11 Q15 6 24 12 Q33 6 42 11 V39 Q33 34 24 40 Q15 34 6 39 Z" />
          <path {...S} d="M24 12 V40 M11 17 Q15 15.5 19 17.5 M11 23 Q15 21.5 19 23.5 M29 17.5 Q33 15.5 37 17" />
        </svg>
      );
    case "star":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-fill" {...S} d="M24 5 L29.5 17.5 L43 18.8 L32.8 27.8 L35.8 41 L24 34 L12.2 41 L15.2 27.8 L5 18.8 L18.5 17.5 Z" />
          <circle cx="20" cy="24" r="1.8" fill="currentColor" />
          <circle cx="28" cy="24" r="1.8" fill="currentColor" />
        </svg>
      );
    case "house":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-paper" {...S} d="M10 22 V42 H38 V22" />
          <path className="ic-fill" {...S} d="M5 24 L24 7 L43 24 Z" />
          <path className="ic-hi" {...S} d="M20 42 V31 Q24 27 28 31 V42" />
        </svg>
      );
    case "gem":
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <path className="ic-fill" {...S} d="M14 8 H34 L43 19 L24 42 L5 19 Z" />
          <path {...S} d="M5 19 H43 M18 19 L24 42 L30 19 M14 8 L18 19 M34 8 L30 19 M24 8 L18 19 M24 8 L30 19" />
        </svg>
      );
    default:
      return (
        <svg className="ic" viewBox="0 0 48 48" aria-hidden="true">
          <circle className="ic-fill" {...S} cx="24" cy="24" r="16" />
        </svg>
      );
  }
}
