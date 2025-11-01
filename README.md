# ZipSite Editorial Experience

A static prototype of the ZipSite marketing site, application flow, portfolio template, and comp card export. The aesthetic blends New York model agency minimalism with an AI-driven product narrative.

## Structure

```
/
├─ index.html               # Home
├─ features.html            # Product pillars
├─ how.html                 # Capture → Curate → Present process
├─ pricing.html             # Free vs Pro comparison
├─ demo.html                # Interactive board preview
├─ press.html               # Press kit & contact
├─ legal.html               # Policy pages
├─ apply/                   # Multi-step talent application
├─ portfolio/               # Talent portfolio template
├─ comp-card/               # Dedicated 5.5 × 8.5 in comp card
├─ styles/                  # global + print stylesheets
├─ scripts/                 # UI behaviour and PDF tooling
└─ assets/                  # Placeholder for brand assets
```

## Local preview

Because the project is static HTML + CSS + JS, any HTTP server works. A quick option:

```bash
npx serve .
```

Or use Python:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000/`.

## Client-side comp card export

1. Navigate to `/comp-card/` in the browser.
2. Optionally pass query params to personalise: `?name=River%20King&stat=Height:6'1"&tier=pro`.
3. Use the **Toggle Free / Pro** button to show or hide the watermark.
4. Click **Download PDF**. html2canvas + jsPDF render the comp-card DOM into `ZipSite_CompCard_{Name}.pdf` with metadata (title, author, subject).

## Server / CLI export with Puppeteer

The repository includes `scripts/render-pdf.js` for high-fidelity output (300 dpi equivalent).

```bash
npm install puppeteer
node scripts/render-pdf.js "http://localhost:8000/comp-card/" ./out.pdf "Natan Barrera" pro
```

Arguments:

1. `comp-card` URL (must be reachable from the machine running Puppeteer).
2. Optional path to save the PDF.
3. Optional talent name for the filename and query string.
4. Optional tier (`free` or `pro`).

The script honours the watermark logic (hidden for `pro`).

## Application flow

* `/apply/` hosts a four-step form with validation, drag-and-drop photo handling, and a review summary. 
* Keyboard navigation is supported; the current step is marked with `aria-current="step"`.

## Portfolio template

* `/portfolio/` accepts `name`, `tier`, or a JSON-encoded `profile` query parameter to populate stats, gallery, and experience.
* Images load lazily with skeleton placeholders.
* Sticky CTAs provide **Download PDF** and **Book talent** actions.

## Accessibility & motion

* Skip link, focus-visible outlines, and high-contrast monochrome palette for AA compliance.
* IntersectionObserver powers 200–320 ms fade/translate reveals while respecting `prefers-reduced-motion`.

## Assets

Remote photography references use royalty-free Unsplash links for prototyping. Replace with licensed agency assets before production.
