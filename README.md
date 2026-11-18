# Pip's Learning Quest 🦊

A fun, interactive day of learning at home for an 8-year-old (Year 4, England National Curriculum).
Plain HTML/CSS/JS: no build step, no dependencies, no tracking. Progress is saved in the browser only.

## Publish on GitHub Pages
1. Create a new repository on GitHub (e.g. `learning-quest`), set to **Public** (free Pages needs this unless you're on a paid plan).
2. Upload all the files in this folder (drag and drop on the repo page → **Commit changes**). Keep `.nojekyll`.
3. Go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute your site is live at `https://YOUR-USERNAME.github.io/learning-quest/`.

Test locally: `python3 -m http.server` then open http://localhost:8000.

## Files
- `index.html`, `app.js`, `styles.css`: the learning site (all activities are in `app.js`)
- `plan.html`: printable lesson plan for parents, with curriculum links
