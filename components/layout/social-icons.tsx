import * as React from "react";
import type { LucideProps } from "lucide-react";

/**
 * lucide-react removed brand/logo icons from its package (confirmed against
 * the installed version — Instagram, Facebook, Youtube, Twitter, Linkedin
 * all throw "no exported member"). These local marks are built as real
 * forwardRef components typed against `LucideProps`, so they satisfy the
 * `LucideIcon` type exactly and drop into `Record<string, LucideIcon>` maps
 * (like PLATFORM_ICON in footer-social-links.tsx) with no other changes.
 *
 * Each mark is a self-contained, full-colour brand badge (own background
 * shape + white glyph) rather than a `currentColor` outline — the footer
 * renders them directly with no extra wrapper circle.
 */

let gradientId = 0;

export const InstagramMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => {
    const id = React.useId?.() ?? String(gradientId++);
    return (
      <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
        <defs>
          <radialGradient id={`ig-grad-${id}`} cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#ig-grad-${id})`} />
        <rect x="9.5" y="9.5" width="13" height="13" rx="4.2" stroke="#fff" strokeWidth="1.8" fill="none" />
        <circle cx="16" cy="16" r="4" stroke="#fff" strokeWidth="1.8" fill="none" />
        <circle cx="21.6" cy="10.4" r="1.15" fill="#fff" />
      </svg>
    );
  }
);
InstagramMark.displayName = "InstagramMark";

export const FacebookMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
      <circle cx="16" cy="16" r="15" fill="#1877F2" />
      <path
        d="M20.5 16.5l.6-4H17.3V9.9c0-1.1.35-1.85 1.9-1.85h2V4.6c-.35-.05-1.53-.15-2.9-.15-2.87 0-4.83 1.75-4.83 4.97V12.5H10.4v4h3.07v10.4c.85.13 1.72.2 2.6.2.55 0 1.1-.03 1.63-.09V16.5h3.8Z"
        fill="#fff"
      />
    </svg>
  )
);
FacebookMark.displayName = "FacebookMark";

export const YoutubeMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
      <rect x="1" y="6" width="30" height="20" rx="6" fill="#FF0000" />
      <path d="M13.5 11.5v9l8-4.5-8-4.5Z" fill="#fff" />
    </svg>
  )
);
YoutubeMark.displayName = "YoutubeMark";

export const XMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#000" />
      <path d="M9 9l14 14M23 9 9 23" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  )
);
XMark.displayName = "XMark";

export const LinkedinMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#0A66C2" />
      <circle cx="10.5" cy="11" r="1.8" fill="#fff" />
      <path d="M10.5 15v9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 24v-6c0-2 1.4-3.3 3.1-3.3 1.7 0 2.9 1.2 2.9 3.3v6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
);
LinkedinMark.displayName = "LinkedinMark";

export const WhatsappMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 32 32" width={size} height={size} className={className} {...props}>
      <circle cx="16" cy="16" r="15" fill="#25D366" />
      <path d="M16 7.5a8.5 8.5 0 0 0-7.34 12.77L7.5 24.5l4.36-1.14A8.5 8.5 0 1 0 16 7.5Z" fill="#fff" />
      <path
        d="M13 13.3c-.1-.5.15-1.05.6-1.2.3-.1.6-.05.75.2l.55.9c.15.25.15.55 0 .8l-.4.6c-.1.15-.1.3 0 .45.35.65 1 1.35 1.65 1.7.15.1.3.1.45 0l.6-.4c.25-.15.55-.15.8 0l.9.55c.25.15.3.45.2.75-.15.45-.7.7-1.2.6-1.4-.3-3.6-1.85-4.9-4.3Z"
        fill="#25D366"
      />
    </svg>
  )
);
WhatsappMark.displayName = "WhatsappMark";
