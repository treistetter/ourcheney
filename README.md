# Our Cheney

Static, mobile-first informational website focused on Phoenix Park II, Phoenix Park III, Cheney Stadium, and the surrounding public land in Summerhill.

The site brings together neighborhood history, public-value context, project-scale information, and recurring themes from resident experiences.

## Routes

- `/` — Home
- `/mission/` — Mission
- `/park/` — Our Park and public-access context
- `/history/` — Our History
- `/public-value/` — Public Value
- `/connect/` — Connect with Us form

## Stack

- Semantic HTML5
- Bootstrap 5.3.3 from the jsDelivr CDN
- One custom stylesheet
- Minimal vanilla JavaScript
- Static directory routes compatible with GitHub Pages

No build step, application server, database server, or framework is required.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

Do not open the HTML files directly from disk. Directory routes such as `history/`
require a local web server.

Run the dependency-free structural check with:

```bash
node scripts/check-site.mjs
```

## GitHub Pages deployment

1. Push the repository to GitHub.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the production branch (normally `main`) and the repository root (`/`).
4. To use `ourcheney.org`, add it under **Custom domain** in the Pages settings
   and configure the required DNS records at the domain registrar.
5. After GitHub verifies a custom domain, enable **Enforce HTTPS**.

The included `.nojekyll` file tells GitHub Pages to publish the repository as-is.
Local assets and routes use repository-relative URLs, so the site works both at
the project URL (`https://treistetter.github.io/ourcheney/`) and at a future
custom domain.

## Content handling

Documentary images are stored locally in optimized web formats.

## Before launch

- Confirm parcel names, boundaries, acreage, and title information.
- Obtain and review written APS access policies.
- Replace the 2013 home-page image with a strong current Summerhill photograph.
- Add dated resident photographs of gates, fencing, fields, access points, and maintenance conditions.
- Run keyboard, screen-reader, contrast, mobile, and reduced-motion checks.
- Verify DNS, the custom domain, and HTTPS.

## Privacy

The Connect page embeds a form hosted by Tally. The site contains no advertising trackers or analytics scripts.
