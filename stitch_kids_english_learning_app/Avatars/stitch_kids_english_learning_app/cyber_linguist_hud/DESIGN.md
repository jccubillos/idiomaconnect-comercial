---
name: Cyber-Linguist HUD
colors:
  surface: '#101417'
  surface-dim: '#101417'
  surface-bright: '#363a3d'
  surface-container-lowest: '#0b0f11'
  surface-container-low: '#191c1f'
  surface-container: '#1d2023'
  surface-container-high: '#272a2d'
  surface-container-highest: '#323538'
  on-surface: '#e0e2e6'
  on-surface-variant: '#e4bdba'
  inverse-surface: '#e0e2e6'
  inverse-on-surface: '#2d3134'
  outline: '#ab8886'
  outline-variant: '#5b403e'
  surface-tint: '#ffb3ae'
  primary: '#ffb3ae'
  on-primary: '#68000b'
  primary-container: '#ff5351'
  on-primary-container: '#5c0008'
  inverse-primary: '#bb1522'
  secondary: '#d3fbff'
  on-secondary: '#00363a'
  secondary-container: '#00eefc'
  on-secondary-container: '#00686f'
  tertiary: '#e5b4ff'
  on-tertiary: '#4f0077'
  tertiary-container: '#c464ff'
  on-tertiary-container: '#450069'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930014'
  secondary-fixed: '#7df4ff'
  secondary-fixed-dim: '#00dbe9'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#f5d9ff'
  tertiary-fixed-dim: '#e5b4ff'
  on-tertiary-fixed: '#30004b'
  on-tertiary-fixed-variant: '#7000a7'
  background: '#101417'
  on-background: '#e0e2e6'
  surface-variant: '#323538'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

This design system targets a teenage demographic by blending the high-octane energy of competitive gaming with the slick, curated feel of premium social media platforms. The brand personality is "Electric Academic"—it treats language acquisition as a high-stakes quest rather than a chore.

The visual style is a hybrid of **Cyberpunk Glassmorphism** and **Social Media Modernism**. It utilizes a deep dark-mode foundation to make neon accents "pop" like a gaming HUD, while employing translucent, blurred layers (glassmorphism) to maintain the airy, premium feel of apps like Spotify or TikTok. The emotional goal is to evoke a sense of progress, technological edge, and social status.

## Colors

The palette is anchored in high-contrast depths and vibrant luminosity. The background uses a "Midnight Navy" (#0A0B1E) for core app surfaces and "Graphite Black" (#121212) for secondary containers, providing a much richer depth than standard black.

The brand's signature **Electric Red** (#FF4B4B) acts as the primary action color, signifying energy and urgency. This is supported by a secondary **Cyan** (#00F0FF) for information and a tertiary **Electric Purple** (#AD00FF) for premium features or leveling-up milestones. **Neon Green** (#39FF14) is reserved strictly for success states and gamified progress. All accent colors should be applied with a soft glow effect (2-4px outer blur) to simulate light emission.

## Typography

This design system utilizes a tiered typography approach to balance personality with readability. **Plus Jakarta Sans** is the primary display face; its modern, rounded-geometric construction provides the "premium social" vibe and high-impact readability for headlines.

**Source Sans 3** is utilized for body text and long-form content, maintaining high legibility during learning exercises while staying neutral enough to let the UI accents shine. Headlines should often be styled with tight letter spacing and occasional neon-text-shadows for a "hacker" aesthetic. Labels and micro-copy use uppercase bold styling to mimic gaming interface telemetry.

## Layout & Spacing

The layout follows a **Fluid HUD** model. Elements are structured on a 4px baseline grid to ensure mathematical precision in sizing. For mobile, a 12-column fluid grid is used with 20px side margins.

Spacing is aggressive to prevent the UI from feeling "cramped." Large vertical gaps (32px+) are used to separate learning modules, while components within a module are tightly packed (8px or 16px) to create visual clusters. Use dynamic padding for "Glass" cards—internal padding should be at least 24px to allow the background blur to be visible around the content.

## Elevation & Depth

Depth is achieved through **Glassmorphism and Luminous Layering** rather than traditional shadows.

1.  **Base Layer:** Midnight Navy (#0A0B1E).
2.  **Surface Layer:** Semi-transparent Graphite (#121212 at 80% opacity) with a 20px backdrop blur.
3.  **Borders:** 1px solid outlines using low-opacity versions of the accent colors (e.g., Cyan at 20% opacity) to create a "glowing wireframe" effect.
4.  **Active State:** Elements at the highest elevation gain an outer "Neon Bloom"—a soft 8-12px shadow tinted with the component’s primary accent color.

## Shapes

The shape language is consistently **Rounded (Level 2)**. Standard components use a 0.5rem (8px) radius, while larger containers and "TikTok-style" feed cards use a 1.5rem (24px) radius. 

This roundedness softens the aggressive "cyber" aesthetic, making the app feel approachable and friendly for a teen audience. Interactive elements like buttons and chips should feel "squishy" and tactile, avoiding sharp corners entirely.

## Components

### Buttons
Primary buttons are high-contrast "Neon Slabs." They use a solid fill of #FF4B4B with white text. Apply a subtle 4px glow in the same color. Secondary buttons are "Ghost" style: transparent background, 1px cyan border, and cyan text.

### Gamified Progress Indicators
Progress bars should never be flat colors. Use a linear gradient (e.g., Cyan to Neon Green) and include a "trailing glow" at the leading edge of the progress line to simulate movement.

### Cards & Containers
All cards must use the Glassmorphism style: `background: rgba(18, 18, 18, 0.7)`, `backdrop-filter: blur(15px)`, and a subtle top-down gradient border.

### Chips & Tags
Used for vocabulary categories or difficulty levels. These are small, pill-shaped elements with a low-opacity fill and a high-intensity 1px border.

### XP & Streak Badges
Floating elements with a slight "tilt" animation (2 degrees) and a constant "breathing" glow effect to signify importance.