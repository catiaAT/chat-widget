# HTML Example Project: Rasa Chatbot Widget Usage

This example project demonstrates the integration of a Rasa chatbot widget into a basic HTML page. The chatbot widget is designed to provide interactive conversational capabilities on your website.

## Installation

- Clone the repository
- Navigate to `examples/html`
- Install dependencies `npm install`
- Start the app `npm run dev`

## Custom icons (`widget-icon` and `bot-icon`)

Place your image files in:

- `packages/ui/src/assets/images/`

Example:

- `packages/ui/src/assets/images/catia_horizontal.png`
- `packages/ui/src/assets/images/catia_vertical.png`

Then reference them in `examples/html/index.html`:

```html
<rasa-chatbot-widget
	widget-icon="./rasa-chatwidget/assets/images/catia_horizontal.png"
	bot-icon="./rasa-chatwidget/assets/images/catia_vertical.png"
></rasa-chatbot-widget>
```

## Automatic sync to `examples/html`

Running `npm run dev` in `examples/html` now builds `packages/ui` and syncs the generated widget bundle to `examples/html/rasa-chatwidget` before starting the server.

## Copying the generated widget to another machine

If you want to reuse the generated widget outside this repository, copy the entire `packages/ui/dist/rasa-chatwidget` folder, including `assets/fonts` and `assets/images`.

Notes:

- The distributed CSS now bundles local `@font-face` declarations for the widget fonts, so the target machine does not need those fonts installed.
- Do not copy only `rasa-chatwidget.css` or `rasa-chatwidget.esm.js`; they depend on files inside `assets/`.
- Serve the copied files over HTTP/HTTPS. Opening the HTML file directly with `file://` can break ES module loading and relative asset resolution.
