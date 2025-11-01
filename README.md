# ZipSite — Editorial AI Portfolio Experience

ZipSite blends the quiet luxury of a model agency with precision AI workflows. This repository contains a static, multi-page marketing site, an application flow, portfolio template, and comp-card export system.

## Structure

```
/
├── index.html              # Landing page
├── features.html           # Feature deep dive
├── how.html                # Automated workflow overview
├── pricing.html            # Free vs Pro plans
├── demo.html               # Interactive board + comp card preview
├── press.html              # Press and partnership hub
├── legal.html              # Privacy policy + terms
├── apply/                  # Multi-step talent application
├── portfolio/              # Dynamic portfolio template
├── comp-card/              # Dedicated 5.5 × 8.5 in comp-card export
├── assets/                 # Logo + icons
├── styles/global.css       # Editorial UI system
├── styles/print.css        # Print-focused comp-card styling
├── scripts/                # Interaction + export utilities
└── scripts/render-pdf.js   # Optional Puppeteer export script
```

## Local Preview

Open `index.html` (or any HTML file) in your browser via a static server. For quick testing run:

```bash
npx serve .
```

This enables client-side routing for portfolio query parameters and ensures asset loading from remote CDNs is allowed.

## Talent Application Flow

- Navigate to `/apply/`.
- Complete the four-step form (Vitals → Photos → Experience → Review).
- Drag-and-drop photos or use the file picker; preview chips display selected files.
- Validation occurs per step; the Review step summarizes data with edit anchors.

## Comp Card Export

### Client-side PDF

1. Visit `/comp-card/?talent=elara` (replace `talent` with `marcus` for other data).
2. Optional: append `&tier=pro` to remove the watermark.
3. Click **Export PDF** to trigger the html2canvas + jsPDF pipeline.
4. The file name follows `ZipSite_CompCard_{Name}.pdf` and includes PDF metadata.

### Browser Print

Use the **Print** link or the browser print dialog. The template is formatted for 5.5 × 8.5 in with 0.25 in margins and respects bleed/safe areas.

### Server/Puppeteer Export

1. Install dependencies: `npm install puppeteer`.
2. Run the script:

```bash
node scripts/render-pdf.js --talent=elara --tier=free --output=./Elara_Free.pdf
```

- `--tier=pro` removes the watermark.
- Output defaults to `ZipSite_CompCard_{talent}_{tier}.pdf` in the current directory.

## Portfolio Template

The portfolio template (`/portfolio/`) consumes the same mock talent dataset. Pass a `talent` query parameter (`elara`, `marcus`, `ayla`, `noah`) to load different profiles. JSON-LD Person metadata is injected for SEO, and CTAs update automatically.

## Accessibility & Motion

- Skip link, focus-visible states, and AA contrast-friendly palette.
- Intersection Observer animates `.fade-in` blocks with a translate/opacity motion respecting `prefers-reduced-motion`.
- Mobile navigation toggles with aria attributes and closes on link selection.

## Assets & Typography

- Fonts: Playfair Display (serif display) + Inter (sans-serif UI) via Google Fonts.
- Icons live under `assets/icons/` and are monochrome for theme consistency.

## Notes

- Remote photography references Unsplash for cinematic placeholders.
- All images use `loading="lazy"` and `decoding="async"` where applicable.
- Update `assets/logo-zipsite.svg` if you have an official mark.
