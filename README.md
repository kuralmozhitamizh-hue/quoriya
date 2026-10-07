# Quoriya

A clean, responsive, knowledge-first website starter designed for GitHub Pages.

## Run locally

Because the site loads `data/topics.json` with `fetch()`, use a local web server rather than double-clicking `index.html`.

With Python:

```bash
cd quoriya
python -m http.server 8000
```

Open `http://localhost:8000`.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open Settings → Pages.
4. Deploy from the `main` branch and `/root` folder.
5. Open the generated Pages URL.

## Content workflow

Edit `data/topics.json` to add or update topics. `admin.html` is a safe starter Content Studio that exports a JSON object for a new topic.

For true one-click publishing from an admin dashboard, use a serverless backend/OAuth flow. Do not put a GitHub personal access token in client-side JavaScript.
