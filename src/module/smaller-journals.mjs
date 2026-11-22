import '../styles/smaller-journals.scss';

const MODULE_ID = 'smaller-journals';

/** Ancho de la barra lateral colapsada en el CSS del núcleo (--sidebar-width-collapsed). */
const COLLAPSED_SIDEBAR_WIDTH = 40;

const setting = (key) => game.settings.get(MODULE_ID, key);

/* -------------------------------------------- */
/*  Ajustes                                     */
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
        name: `${t('StartCollapsed')}.Name`,
        hint: `${t('StartCollapsed')}.Hint`,
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
    });
    numberSetting('pageWidth', 550, 300, 1600);
    numberSetting('minWidth', 400, 300, 680, applyCssVariables);
}

/** Expone los ajustes de CSS como variables en :root para que las use styles/smaller-journals.css. */
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
/*  Parches                                     */
/* -------------------------------------------- */

/**
 * Sustituye el ancho inicial de una clase de hoja, solo si quien abre la hoja no pidió un ancho
 * explícito y si la clase concreta (p. ej. la de otro módulo) no ha cambiado el ancho por defecto del núcleo.
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

    // Ancho inicial del diario: el configurado, más la barra lateral si se abre expandida.
    patchInitialWidth(JournalEntrySheet, () => {
        const width = setting('entryWidth');
        if (setting('startCollapsed')) return width;
        return width + setting('sidebarWidth') - COLLAPSED_SIDEBAR_WIDTH;
    });

    // Ancho inicial de las páginas abiertas en su propia ventana.
    patchInitialWidth(JournalEntryPageSheet, () => setting('pageWidth'));

    // Barra lateral colapsada en el primer renderizado. Solo la primera vez que se abre la hoja en la
    // sesión: si la reabres, conserva el estado (y el ancho) que dejaste.
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
