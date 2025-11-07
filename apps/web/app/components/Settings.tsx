'use client';

/**
 * Settings component props.
 */
export interface SettingsProps {
  /** Current preferred locale value. */
  readonly locale: string;
  /** Invoked when the locale selection changes. */
  readonly onLocaleChange: (locale: string) => void;
  /** Invoked when the settings sheet should close. */
  readonly onClose: () => void;
}

/**
 * Minimal settings sheet exposing language preferences and accessibility toggles.
 */
export function Settings({ locale, onLocaleChange, onClose }: SettingsProps): JSX.Element {
  return (
    <aside className="settings" aria-label="Settings">
      <header className="settings__header">
        <h2>Settings</h2>
        <button type="button" className="settings__close" onClick={onClose}>
          Close
        </button>
      </header>
      <label className="settings__field">
        <span>Preferred language</span>
        <select
          value={locale}
          onChange={(event) => onLocaleChange(event.target.value)}
          aria-label="Preferred language"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
        </select>
      </label>
      <p className="settings__hint">Additional preferences will appear here as we expand the app.</p>
    </aside>
  );
}
