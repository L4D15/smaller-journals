import '../styles/smaller-journals.scss';

const MODULE_ID = 'smaller-journals';

/** Width of the collapsed sidebar in core's CSS (--sidebar-width-collapsed). */
const COLLAPSED_SIDEBAR_WIDTH = 40;

const setting = (key) => game.settings.get(MODULE_ID, key);

/* -------------------------------------------- */
/*  Settings                                    */
/* -------------------------------------------- */

function registerSettings() {
    const t = (key) => `SMALLER_JOURNALS.Settings.${key}`;
    const numberSetting = (key, def, min, max, onChange) =>
        game.settings.register(MODULE_ID, key, {
            name: `${t(key)}.Name`,
            hint: `${t(key)}.Hint`,
            scope: 'client',
            config: true,
            type: Number,
            range: { min, max, step: 10 },
            default: def,
            onChange,
        });

    numberSetting('entryWidth', 550, 300, 1600);
    numberSetting('sidebarWidth', 220, 120, 400, applyCssVariables);
    game.settings.register(MODULE_ID, 'startCollapsed', {
        name: `${t('startCollapsed')}.Name`,
        hint: `${t('startCollapsed')}.Hint`,
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
    });
    numberSetting('pageWidth', 550, 300, 1600);
    numberSetting('minWidth', 400, 300, 680, applyCssVariables);
}

/** Exposes the CSS-related settings as variables on :root, used by the module stylesheet. */
function applyCssVariables() {
    const root = document.documentElement.style;
    root.setProperty(
        '--smaller-journals-sidebar-width',
        `${setting('sidebarWidth')}px`
    );
    root.setProperty(
        '--smaller-journals-min-width',
        `${setting('minWidth')}px`
    );
}

/* -------------------------------------------- */
/*  Patches                                     */
/* -------------------------------------------- */

/**
 * Replaces the initial width of a sheet class, only when the caller didn't request an explicit width
 * and the concrete class (e.g. one from another module) hasn't changed core's default width.
 */
function patchInitialWidth(cls, getWidth) {
    const coreWidth = cls.DEFAULT_OPTIONS.position.width;
    const original = cls.prototype._initializeApplicationOptions;
    cls.prototype._initializeApplicationOptions = function (options) {
        const applicationOptions = original.call(this, options);
        const requested = options?.position?.width !== undefined;
        if (!requested && applicationOptions.position.width === coreWidth) {
            applicationOptions.position.width = getWidth();
        }
        return applicationOptions;
    };
}

function patchJournalSheets() {
    const { JournalEntrySheet, JournalEntryPageSheet } =
        foundry.applications.sheets.journal;
    const { RENDER_STATES } = foundry.applications.api.ApplicationV2;

    // Initial journal width: the configured one, plus the sidebar if it opens expanded.
    patchInitialWidth(JournalEntrySheet, () => {
        const width = setting('entryWidth');
        if (setting('startCollapsed')) return width;
        return width + setting('sidebarWidth') - COLLAPSED_SIDEBAR_WIDTH;
    });

    // Initial width of pages opened in their own window.
    patchInitialWidth(JournalEntryPageSheet, () => setting('pageWidth'));

    // Collapsed sidebar on first render. Only the first time the sheet opens in the session:
    // reopening it keeps the state (and width) you left it with.
    const configureRenderOptions =
        JournalEntrySheet.prototype._configureRenderOptions;
    JournalEntrySheet.prototype._configureRenderOptions = function (options) {
        if (
            this.state === RENDER_STATES.NONE &&
            !('expanded' in options) &&
            setting('startCollapsed')
        ) {
            options.expanded = false;
        }
        return configureRenderOptions.call(this, options);
    };
}

/* -------------------------------------------- */

Hooks.once('init', () => {
    registerSettings();
    applyCssVariables();
    patchJournalSheets();
});
