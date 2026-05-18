# @aw-webflow/ai_workforce_home

Custom JavaScript for a Webflow page.

## Usage via jsDelivr CDN

Add this script tag to the Webflow page (Page Settings → Custom Code → Before `</body>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@aw-webflow/ai_workforce_home@1.0.0/script.min.js"></script>
```

Replace `1.0.0` with the version you want to pin to.

## Deployment Workflow

1. Push changes to GitHub.
2. Bump the `version` in `package.json`.
3. Run `npm publish --access public`.
4. jsDelivr automatically serves the new version.
5. Update the Webflow script tag with the new version number.

## Local Development

```bash
npm install
npm start
```

`npm start` runs Parcel against `script.js` for local development.
