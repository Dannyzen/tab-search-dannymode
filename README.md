# FuzzyTabs

A tiny Firefox extension that lets you **fuzzy-search your open tabs (and bookmarks) and jump to them instantly** — no reaching for the mouse, no scrolling through an overcrowded tab strip.

Press a shortcut, start typing, hit <kbd>Enter</kbd>. Done.

## Why this exists

Chrome has this built in. Click the little chevron at the end of the tab strip (or press <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> on macOS / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> elsewhere) and Chrome pops up its native **"Search tabs"** box — a searchable list of everything you have open, so you can filter by title/URL and switch to a tab without hunting for it.

Firefox has no equivalent built in. **FuzzyTabs recreates that Chrome behavior in Firefox** — right down to the same keyboard shortcut — and adds fuzzy matching and a bookmarks mode on top.

## Features

- **Fuzzy search across open tabs** — matches loosely against tab titles and URLs (powered by [microfuzz](https://github.com/Nozbe/microfuzz)), so partial or out-of-order typing still finds the right tab. Matched characters are highlighted in the results.
- **Most-recently-used ordering** — tabs are sorted by last-accessed time, so the tab you're most likely reaching for is already near the top before you type anything.
- **Cross-window switching** — jumping to a tab in another window focuses that window and activates the tab.
- **Bookmarks mode** — search your bookmarks the same way and open the selected one in a new tab.
- **Close tabs without leaving the search** — kill the focused tab (or click the close button on any row) and keep going.
- **Fully keyboard-driven** — open, filter, navigate, switch, and close entirely from the keyboard.
- **Chrome-compatible codebase** — uses the `browser.*` WebExtension API with a `chrome.*` fallback.

## Keyboard shortcuts

| Action | macOS | Other platforms |
| --- | --- | --- |
| Open FuzzyTabs (tab search) | <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> |
| Open in bookmarks mode | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> |

Inside the popup:

| Key | Action |
| --- | --- |
| Type | Fuzzy-filter the list |
| <kbd>↓</kbd> / <kbd>Ctrl</kbd>+<kbd>N</kbd> | Move focus down |
| <kbd>↑</kbd> / <kbd>Ctrl</kbd>+<kbd>P</kbd> | Move focus up |
| <kbd>Enter</kbd> | Switch to the tab (or open the bookmark) |
| <kbd>Tab</kbd> | Toggle between tab and bookmark mode |
| <kbd>Ctrl</kbd>+<kbd>W</kbd> (mac) / <kbd>Alt</kbd>+<kbd>W</kbd> (other) | Close the focused tab |
| <kbd>Esc</kbd> | Close FuzzyTabs |

You can rebind the launch shortcut anytime in **`about:addons` → gear → Manage Extension Shortcuts**.

## Getting the true Chrome ⌘⇧A behavior

Chrome's native tab search is bound to <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> (macOS) / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd>. In Firefox that exact combo is **reserved** by the browser for the Add-ons Manager, so by default you can't assign it to an extension — Manage Extension Shortcuts will reject it. To make FuzzyTabs behave like Chrome and open on that shortcut, you first have to free it up.

Firefox **147+** ships a built-in page for this: **`about:keyboard`** (it's labelled *experimental*).

1. Open **`about:keyboard`**.
2. In **Search**, type `extensions` to find the **Extensions and Themes** shortcut (that's the one holding ⌘⇧A / Ctrl+Shift+A).
3. Click **Change** and set it to something else, or clear it — either way ⌘⇧A is now free. (**Reset** on that row, or **Reset all shortcuts to defaults** at the bottom, puts it back.)
4. Now assign ⌘⇧A to FuzzyTabs in `about:addons` → gear → **Manage Extension Shortcuts** → *Open FuzzyTabs*. It'll be accepted now that the built-in no longer reserves it.

That's it — ⌘⇧A now opens FuzzyTabs, mirroring Chrome's tab search. This lives in your profile, so it survives Firefox updates (no app-bundle hacks required).

## Installing (development)

FuzzyTabs is plain, unbundled JavaScript — there's no build step.

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on…**
3. Select `manifest.json` from this repo.

(Temporary add-ons are removed when Firefox restarts. For a permanent install, the extension needs to be packaged as a `.xpi` and signed through [addons.mozilla.org](https://addons.mozilla.org).)

## Permissions

- `tabs` — list, activate, and close tabs
- `bookmarks` — read bookmarks for bookmarks mode
- `storage` — remember the current mode when opened via shortcut

## License

No license file is currently included in this repository. Add one if you intend to make reuse terms explicit.
