const base = "fill-none stroke-current stroke-[1.5] stroke-linecap-round stroke-linejoin-round";

export const PotteryIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 6h10M10 6c-2 3-4 6-4 9a10 10 0 0020 0c0-3-2-6-4-9" className={base} />
    <path d="M8 15h16M12 22c0 1.1.9 2 2 2h4a2 2 0 002-2" className={base} />
    <line x1="16" y1="3" x2="16" y2="6" className={base} />
  </svg>
);

export const JewelryIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,5 22,12 16,27 10,12" className={base} />
    <polygon points="10,12 16,5 22,12 16,14" className={base} />
    <line x1="10" y1="12" x2="16" y2="14" className={base} />
    <line x1="22" y1="12" x2="16" y2="14" className={base} />
  </svg>
);

export const LeatherIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10" width="22" height="16" rx="2" className={base} />
    <path d="M5 14h22" className={base} />
    <path d="M13 10V8a3 3 0 016 0v2" className={base} />
    <rect x="13" y="16" width="6" height="4" rx="1" className={base} />
  </svg>
);

export const CarpetsIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="22" height="22" rx="2" className={base} />
    <rect x="9" y="9" width="14" height="14" rx="1" className={base} />
    <path d="M16 9v14M9 16h14" className={base} />
    <circle cx="16" cy="16" r="2.5" className={base} />
  </svg>
);

export const WoodworkIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4C10 4 6 8 6 14c0 4 2 6 4 8l2 6h8l2-6c2-2 4-4 4-8 0-6-4-10-10-10z" className={base} />
    <path d="M12 28h8M16 14v6" className={base} />
    <path d="M11 12c1-2 3-3 5-3s4 1 5 3" className={base} />
  </svg>
);

export const EmbroideryIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" className={base} />
    <path d="M16 6v20M6 16h20" className={base} />
    <path d="M9 9l14 14M23 9L9 23" className={base} />
    <circle cx="16" cy="16" r="3" className={base} />
  </svg>
);

export const MetalworkIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 5l2 2-9 9-2-2 9-9z" className={base} />
    <path d="M13 16l-6 8a2 2 0 002.8 2.8l8-6" className={base} />
    <circle cx="20" cy="12" r="2" className={base} />
    <path d="M22 7l3-3 2 2-3 3" className={base} />
  </svg>
);

export const PapyrusIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4c0 0 2 2 0 4S6 12 8 14s2 4 0 6 0 4 0 4" className={base} />
    <rect x="10" y="6" width="16" height="20" rx="2" className={base} />
    <line x1="14" y1="11" x2="22" y2="11" className={base} />
    <line x1="14" y1="15" x2="22" y2="15" className={base} />
    <line x1="14" y1="19" x2="19" y2="19" className={base} />
  </svg>
);

export const WeavingIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8h16v16H8z" className={base} />
    <path d="M8 12h16M8 16h16M8 20h16" className={base} />
    <path d="M12 8v16M16 8v16M20 8v16" className={base} />
    <path d="M6 6l2 2M26 6l-2 2M6 26l2-2M26 26l-2-2" className={base} />
  </svg>
);

export const CeramicsIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 8h12l2 4H8l2-4z" className={base} />
    <path d="M8 12c0 8 3 12 8 12s8-4 8-12" className={base} />
    <path d="M22 16h3a2 2 0 010 4h-3" className={base} />
    <path d="M12 18c1 2 2 3 4 3" className={base} />
  </svg>
);

export const AllIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="11" className={base} />
    <path d="M16 5v22M5 16h22" className={base} />
    <path d="M8 8a16 16 0 0016 0M8 24a16 16 0 0016 0" className={base} />
  </svg>
);
