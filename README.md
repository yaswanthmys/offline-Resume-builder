# Offline Resume Builder

A completely offline resume builder made with plain HTML, CSS, and JavaScript. It runs in the browser without external libraries, accounts, build tools, or internet access.

## Features

- A4 portrait resume preview
- ATS-friendly single-column resume layout
- Step-by-step SPA flow
- Personal details with custom extra fields
- Education and skills sections
- Optional sections for experience, projects, certificates, achievements, languages, links, interests, references, publications, and volunteer work
- Local draft saving with `localStorage`
- Light and dark mode toggle
- Mobile sidebar drawer
- PDF export through the browser print dialog
- DOCX export generated directly in the browser

## How To Use

Open `index.html` in any modern browser.

No installation is required.

```text
index.html
styles.css
app.js
```

Fill the resume in order:

1. Personal details
2. Education
3. Skills
4. Additional sections
5. Section details
6. Review and export

## Exporting

Use **PDF** to open the browser print dialog, then choose **Save as PDF**.

Use **DOCX** to download an editable Word document.

## Resume Format

The resume is designed around common ATS-friendly guidelines:

- A4 page
- Portrait orientation
- Single-column layout
- Mostly black and gray text
- One subtle accent color
- Clean section headings
- Text-based content with no images or decorative resume elements
- Modern system font stack using Aptos, Segoe UI, Calibri, and Arial fallbacks

## Offline Behavior

Everything runs locally in the browser. Drafts are saved only on the current device and browser using `localStorage`.

Clearing browser storage or using the app in another browser will not carry the saved draft over.

## Files

- `index.html` contains the app structure.
- `styles.css` contains layout, responsive styles, theme styles, and print styles.
- `app.js` contains the SPA flow, state handling, preview rendering, PDF trigger, and DOCX generation.

## Notes

For best PDF results, export from a desktop browser and keep browser print scaling at default or 100%.
