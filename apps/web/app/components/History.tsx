'use client';

import type { ImageAnalysisResult } from '@imboni/shared';

/**
 * Props for the {@link History} component.
 */
export interface HistoryProps {
  /** Previous AI responses persisted for the user. */
  readonly entries: readonly ImageAnalysisResult[];
  /** Handler invoked when the history panel is toggled. */
  readonly onClose: () => void;
}

/**
 * Slide-over history panel showing the most recent interactions.
 */
export function History({ entries, onClose }: HistoryProps): JSX.Element {
  return (
    <aside className="history" aria-label="Interaction history">
      <header className="history__header">
        <h2>Recent</h2>
        <button type="button" onClick={onClose} className="history__close">
          Close
        </button>
      </header>
      <ul className="history__list">
        {entries.map((entry) => (
          <li key={entry.id} className="history__item">
            <span className="history__timestamp">{new Date(entry.completedAt).toLocaleString()}</span>
            <p className="history__caption">{entry.description.caption}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
