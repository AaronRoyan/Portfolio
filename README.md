# Aaron Royan — Portfolio

Personal site of Aaron Royan, software engineer and AI engineer based in Sheffield.

**Live:** [aaron-portfolio.vercel.app](https://aaron-portfolio.vercel.app)

## Stack

Plain HTML, CSS and JavaScript. No framework, no build step.

- **GSAP** (with ScrollTrigger and SplitText) and **Lenis** handle motion and smooth scrolling. Both are vendored in `assets/vendor/`.
- **Instrument Serif**, **Geist** and **Geist Mono** come from Google Fonts.
- Every figure on the page is a small canvas program in `assets/js/figures.js`:
  - a live 2-opt route solver
  - a warehouse pick-path schematic
  - a travel-cost matrix optimiser
  - a job board
  - EEG artifact removal
  - LLM prompt recovery
  - a model-to-API pipeline

Figures only animate while they're on screen. With reduced motion enabled they settle into still frames.

## Structure

```
index.html              the whole site, one page
404.html                not-found page
assets/css/style.css    design tokens, layout, responsive rules
assets/js/main.js       smooth scroll, reveals, nav, cursor, previews, clock
assets/js/figures.js    the canvas figures
assets/vendor/          gsap, ScrollTrigger, SplitText, lenis
docs/Aaron-Royan-CV.pdf downloadable CV
vercel.json             redirects from the old site's pages
```

## Run locally

Open `index.html` directly, or serve the folder:

```sh
npx serve .
```

## Editing content

All copy lives in `index.html`. To swap the downloadable CV, replace `docs/Aaron-Royan-CV.pdf` and keep the same file name.
