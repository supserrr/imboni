'use client';

import type { ImageAnalysisResult } from '@imboni/shared';
import { confidenceBand } from '@imboni/shared';

/**
 * Props for {@link AIResponse} component.
 */
export interface AIResponseProps {
  /** Latest AI analysis result to present. */
  readonly result?: ImageAnalysisResult;
  /** Indicates whether the AI is currently processing an image. */
  readonly isLoading: boolean;
  /** Optional error message to display. */
  readonly error?: string | null;
}

/**
 * Displays AI generated feedback with strong focus on clarity and accessibility.
 */
export function AIResponse({ result, isLoading, error }: AIResponseProps): JSX.Element {
  return (
    <section aria-live="polite" className="ai-response">
      <header className="ai-response__header">
        <span className="ai-response__title">Instant Assistant</span>
        {result ? <span className="ai-response__confidence">{confidenceBand(result.confidence)}</span> : null}
      </header>

      {isLoading ? <p className="ai-response__loading">Analyzing image…</p> : null}

      {error ? (
        <p role="alert" className="ai-response__error">
          {error}
        </p>
      ) : null}

      {result ? (
        <article className="ai-response__content">
          <p className="ai-response__caption">{result.description.caption}</p>
          {result.description.observations.length > 0 ? (
            <ul className="ai-response__list">
              {result.description.observations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {result.description.textBlocks && result.description.textBlocks.length > 0 ? (
            <section className="ai-response__ocr">
              <h3>Detected Text</h3>
              <p>{result.description.textBlocks.join(' ')}</p>
            </section>
          ) : null}
        </article>
      ) : null}

      {!result && !isLoading && !error ? (
        <p className="ai-response__placeholder">Capture an image to receive guidance instantly.</p>
      ) : null}
    </section>
  );
}
