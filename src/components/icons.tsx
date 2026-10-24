type IconProps = { size?: number };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const UserIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const CartIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 4h2l2.4 11h11.2L21 8H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
);
export const MenuIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ArrowIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.4}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ChevronIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.4}><path d="M9 6l6 6-6 6" /></svg>
);
export const TrashIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const TruckIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M2 6h11v9H2zM13 9h4l3 3v3h-7" /><circle cx="6" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
);
export const CardIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
);
export const PercentIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M5 19L19 5" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></svg>
);
export const PinIcon = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const ShieldIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const BikeIcon = ({ size = 84 }: IconProps) => (
  <svg width={size} height={Math.round(size * 0.62)} viewBox="0 0 48 30" {...base} strokeWidth={1.6}>
    <circle cx="10" cy="20" r="8" /><circle cx="38" cy="20" r="8" /><path d="M10 20l8-12h14l6 12M18 8l6 12h8M24 20l-6-12M30 4h5" />
  </svg>
);
export const WhatsappIcon = ({ size = 28 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.5-1.8-1.3-2.3-2.3l.8-1-1-2z" />
  </svg>
);
export const InstagramIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" /></svg>
);
export const FacebookIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>
);
export const TiktokIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M14 4v11a3.5 3.5 0 1 1-3.5-3.5M14 4c.5 2.5 2.5 4 5 4" /></svg>
);
export const RulerIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><path d="M3 15.5L15.5 3 21 8.5 8.5 21z" /><path d="M7 12l2 2M10 9l2 2M13 6l2 2" /></svg>
);
export const PlayIcon = ({ size = 40 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="10" /><path d="M10 8.5v7l5.5-3.5z" /></svg>
);
