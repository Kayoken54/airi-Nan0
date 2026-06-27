# Proposal: AnimaDex Character Creator Wizard

This proposal outlines the integration of the **AnimaDex** dataset (36k+ curated anime characters) into the **AIRI** character creation and import pipeline. The goal is to allow users to search for their favorite character, select them, and have the AIRI character creation wizard pre-fill all identity, prompt, tag, and visual setup fields.

We present two alternative implementation paths for this feature.

---

## Route A: Native Offline Integration (No Images)

In this approach, the 46MB SQLite metadata database (`animadex.db`) is bundled directly with the AIRI desktop distribution.

### How it Works
1. A native Vue search modal is built inside the settings or card manager view.
2. When the user opens the modal, AIRI queries the bundled database locally via Electron IPC.
3. The UI presents a fast, searchable, and filterable table/grid of characters (by name, series, hair/eye color, gender).
4. No images are displayed (except perhaps local generic silhouettes or default system placeholders) to keep the bundle size small.
5. The user selects a character, and the wizard is immediately spawned with all pre-filled fields.

### Pros
* **Fully Offline**: Works without any internet connection.
* **Speed**: Queries to a local SQLite database are instantaneous (< 15ms).
* **Privacy**: No external network requests are made when searching or selecting.
* **Control**: Zero external dependencies or website hosting required.

### Cons
* **No Visual Previews**: Browsing characters without thumbnails/renders can feel dry or less premium.
* **Bundle Size**: Adds ~45MB to the AIRI base installation size.

---

## Route B: Purpose-Built Hosted Directory (With Images)

In this approach, we host a lightweight, static companion page on a free hosting tier (e.g., GitHub Pages, Vercel, or Cloudflare Pages) containing the search interface and displaying the characters with their web-hosted thumbnails/images.

### How it Works
1. AIRI settings contains a button that links to the hosted companion page or embeds it via an iframe/webview.
2. The user browses the hosted page, which displays character tiles, thumbnails, and detail views using CDN/web-hosted images (avoiding any image storage in the local AIRI app).
3. When the user clicks "Import to AIRI" on the page:
   * **Webview/Iframe Channel**: If embedded, the page posts a cross-document message (`window.parent.postMessage({ type: 'AIRI_IMPORT', ... })`) which the AIRI app listens to.
   * **Custom Protocol/Intercept**: Alternatively, clicking the button triggers a download of a custom `.json` card file. AIRI captures/intercepts this file or handles the download, immediately prompting the user to spawn the wizard.
4. The wizard is bootstrapped and pre-filled with the downloaded metadata.

### Pros
* **Rich Visual Experience**: Users can see character images and renders while browsing.
* **Zero App Bloat**: The base AIRI install size is completely unaffected.
* **Easy Updates**: The database is hosted on the web, so updates to the catalogue are immediately available to all users without updating the desktop app.

### Cons
* **Online Only**: Requires an active internet connection to browse.
* **Hosting Overhead**: Requires standing up and maintaining the companion website (though it can be built as a zero-cost static page).

---

## Open Questions

### 1. Metadata Mapping & Translation
* How do we best translate the raw AnimaDex fields into AIRI character card attributes?
  * What logic should be used to map `core_tags` into behavioral system prompt modifiers?
  * How should the Stable Diffusion `trigger` prompt translate into the LLM system prompt definition?
  * Should we auto-populate recommended voice/personality archetypes based on physical attributes (e.g., gender, hair/eye color, series theme)?

### 2. Image Retention
* If we use Route B (or Route A with web fallback), when a character is imported, should AIRI attempt to download and save their thumbnail locally so they have an avatar inside the app? If so, where should this live in the local filesystem?
