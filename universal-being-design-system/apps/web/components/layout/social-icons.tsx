import * as React from "react";
import type { LucideProps } from "lucide-react";

/**
 * lucide-react removed brand/logo icons from its package (confirmed against
 * the installed version — Instagram, Facebook, Youtube, Twitter, Linkedin
 * all throw "no exported member"). These local marks are built as real
 * forwardRef components typed against `LucideProps`, so they satisfy the
 * `LucideIcon` type exactly and drop into `Record<string, LucideIcon>` maps
 * (like PLATFORM_ICON in footer-social-links.tsx) with no other changes.
 */

export const InstagramMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  )
);
InstagramMark.displayName = "InstagramMark";

export const FacebookMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path
        d="M15 8.5h2V5.2c-.35-.05-1.54-.2-2.94-.2C11.4 5 9.75 6.55 9.75 9.4V12H7v3.6h2.75V22h3.4v-6.4h2.63l.42-3.6h-3.05V9.7c0-.9.24-1.2 1.25-1.2Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  )
);
FacebookMark.displayName = "FacebookMark";

export const YoutubeMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
    </svg>
  )
);
YoutubeMark.displayName = "YoutubeMark";

export const XMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
);
XMark.displayName = "XMark";

export const LinkedinMark = React.forwardRef<SVGSVGElement, LucideProps>(
  ({ className, size = 24, strokeWidth = 1.75, ...props }, ref) => (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" className={className} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="8" cy="8.5" r="1.2" fill="currentColor" />
      <path d="M8 11.5v6M12.5 17.5v-3.5c0-1.4 1-2.2 2-2.2s1.8.8 1.8 2.2v3.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
);
LinkedinMark.displayName = "LinkedinMark";
