# Figma: Playdar — App flow

Every screen of the app as an editable board, built from the app itself: **[Playdar — App flow](https://www.figma.com/design/hp3qNzSk2pgTB5RMJrw7Ys)**.

## What's in the file

- **Flow** page: one board per screen, grouped into seven sections in the order you meet them: onboarding, explore and search, places and vibe checks, saved and family, Hard Hat Hunt spotting, Hard Hat Hunt collection and community, and dark mode. Codes such as A1 or E5 give each board a short name for comments.
- Boards use auto layout and the shared components, so text edits reflow like they do in the app.
- **Components** page: icons, the 20 machine illustrations (plus locked silhouettes), cover art and about a hundred UI components. Edit one and every board that uses it updates.
- Colours are variables in two collections, `Playdar · Light` and `Playdar · Dark`. Type and shadows are shared text and effect styles.
- Grey "Kid's photo" boxes stand in for the photos families take in the Hunt.

## Finish the build (one time)

The file was built through Figma's MCP connection, which allows 20 calls a month on the Starter plan. That ran out after 29 of the 37 boards. The plugin in [`finish-flow/`](finish-flow) does the rest from inside Figma:

1. Open the file in the **Figma desktop app** (development plugins don't run in the browser).
2. Main menu → **Plugins → Development → Import plugin from manifest…** and choose `design/figma/finish-flow/manifest.json`.
3. Run **Plugins → Development → Playdar · finish flow**. It takes under a minute and closes with a summary.

It adds the last eight boards (E12–E15 and four dark-mode boards), groups the boards into sections, wires the taps for the clickable prototype (buttons, rows, map pins, tab bars and the scanning screen's auto-advance), sets the flow starting points, adds a read-me board, labels the Components page and deletes the hidden `_build data` frame. Running it a second time does nothing.

If Figma won't import the manifest, make a new plugin instead (**Plugins → Development → New plugin…**, Figma design, "Run once"), then replace its `code.js` with the one here and run it.

## Share it

- **Boards:** Share → set access to *Anyone with the link* (can view) → Copy link. People with the link can look without a Figma account; commenting needs a free account.
- **Clickable prototype:** press Play (top right), then use Share prototype in the presentation view. Flows start at Onboarding, Explore, Hard Hat Hunt and Dark mode.
