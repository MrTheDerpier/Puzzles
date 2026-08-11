# Pocket Puzzles

A mobile-first progressive web app for making simple jigsaw puzzles from public-domain-friendly sources such as NASA, Smithsonian Open Access, and selected Wikimedia Commons images. It also includes an optional advanced menu where a player can enter their own Gemini API key and generate a custom puzzle from a prompt.

## Run locally

```bash
npm run start
```

Then open <http://localhost:5173>.

## Build/check

```bash
npm run build
```

The build command validates the required static files, manifest JSON, and relative asset paths used for GitHub Pages project hosting.

## GitHub Pages hosting

This app is fully static: HTML, CSS, JavaScript, icons, manifest, and service worker only. It does not need a backend server. Host the repository root with GitHub Pages and the relative asset paths will work from either a user page or a project page subdirectory.

## Android install

Open the GitHub Pages URL in Chrome on Android and choose **Add to Home screen**. The web app manifest and service worker allow the game to launch like an installed app.
