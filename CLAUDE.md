# @aw-webflow/ai_workforce_home

## Project Overview

Custom JavaScript for a Webflow page, published to npm as the scoped package `@aw-webflow/ai_workforce_home` and consumed in Webflow via the jsDelivr CDN.

## Code Style

All code in `script.js` must use `var` and ES5 syntax for maximum browser compatibility. Avoid `let`, `const`, arrow functions, template literals, destructuring, classes, and other ES6+ features — Webflow pages may be rendered in older browsers, and the script is shipped to jsDelivr without a transpile step.

## Deployment

1. Push changes to GitHub.
2. Bump the `version` in `package.json`.
3. Run `npm publish --access public` to publish to npm under the `@aw-webflow` scope.
4. jsDelivr automatically serves the new version at:
   ```
   https://cdn.jsdelivr.net/npm/@aw-webflow/ai_workforce_home@<version>/script.min.js
   ```
5. Update the Webflow page's custom script tag to point at the new version.
