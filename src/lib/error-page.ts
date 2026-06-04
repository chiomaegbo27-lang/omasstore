export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Oma's Store</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #fff7fd; color: #111827; }
      main { width: min(92vw, 460px); text-align: center; }
      h1 { margin: 0 0 12px; font-size: 32px; line-height: 1.1; }
      p { margin: 0 0 24px; color: #4b5563; line-height: 1.55; }
      a, button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 0; font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
      button { background: #0b74f1; color: white; }
      a { margin-left: 10px; background: white; color: #111827; box-shadow: inset 0 0 0 1px #d1d5db; }
    </style>
  </head>
  <body>
    <main>
      <h1>Oma's Store is refreshing</h1>
      <p>Please reload the page. If this keeps happening, go back home and try again.</p>
      <button onclick="location.reload()">Reload</button>
      <a href="/">Go home</a>
    </main>
  </body>
</html>`;
}