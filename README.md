# Our Cheney

Static, mobile-first campaign website for **Our Cheney**, a resident-led public information and organizing effort focused on Phoenix Park II, Phoenix Park III, Cheney Stadium, and the surrounding public land in Summerhill.

The site supports a world-class indoor track in Summerhill while making the case for local control, a fair partnership, and legally durable neighborhood protections.

## Routes

- `/` — Home
- `/history/` — Our History
- `/ownership/` — A Better Ownership Model
- `/public-value/` — What Is the Deal Worth?
- `/the-ask/` — The Ask
- `/next-step/` — Community Partnership Agreement
- `/petition/` — Petition and Tally signature form
- `/stories/` — Share Your Story

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

## Launch configuration

Edit `assets/js/config.js`:

```js
window.OUR_CHENEY_CONFIG = {
  tallyFormId: "YOUR_PETITION_FORM_ID",
  storiesTallyFormId: "YOUR_STORIES_FORM_ID"
};
```

### Tally and Airtable

The Petition and Stories pages contain responsive Tally form mounts.

1. Configure the petition form with full name, email address, phone number, street address, resident or stakeholder status, a petition-agreement checkbox, and typed signature fields.
2. Configure the story form with name, email address, phone number, experience, and photograph-upload fields.
3. Connect Tally to Airtable from Tally's private integration settings.
4. Put only the Tally form IDs in `assets/js/config.js`.
5. Submit test responses on mobile and desktop.
6. Confirm an appropriate success message for each form.

Never add Airtable API keys, base IDs, private response data, or other credentials to this repository.

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

Documentary images are stored as optimized WebP files, with attribution included in their captions.

## Before launch

- Confirm parcel names, boundaries, acreage, and title information.
- Obtain and review written APS access policies.
- Replace the 2013 home-page image with a strong current Summerhill photograph.
- Add dated resident photographs of gates, fencing, fields, access points, and maintenance conditions.
- Confirm the Tally form ID, privacy settings, success message, and private Airtable integration.
- Run keyboard, screen-reader, contrast, mobile, and reduced-motion checks.
- Verify DNS, the custom domain, and HTTPS.

## Privacy

The site contains no advertising tracker or analytics script. Tally is loaded only after a real form ID is configured. Contact information should be used only for campaign updates and organizing related to this effort.
