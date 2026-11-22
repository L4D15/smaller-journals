# Smaller Journals

Opens journals in FoundryVTT with a smaller width, without stopping you from resizing them afterwards.

## Features

-   Configurable initial width for journals and for journal pages opened in their own window.
-   Journals can still be resized freely, down to a configurable minimum width (Foundry forces 680px).
-   Optionally open journals with the page sidebar collapsed.
-   Configurable sidebar width.

All settings are per client, so each player can pick their own.

Only the initial width of the core journal sheets changes: sheets from other modules that set their own width keep it.

## Development

-   `npm install`
-   `npm run dev`: builds in watch mode straight into the Foundry data folder set in `foundryconfig.json` (`data_folder`).
-   `npm run build`: production build in `dist/smaller-journals` plus `dist/smaller-journals.zip`.

Pushing a tag on `master` publishes a GitHub release with the zip and the manifest.
