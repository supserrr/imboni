'use client';

import type { HandoffRequest } from '@imboni/shared';

/**
 * Props for {@link HumanHandoff} component.
 */
export interface HumanHandoffProps {
  /** Callback executed when the user requests human assistance. */
  readonly onRequest: () => Promise<void> | void;
  /** Latest handoff state received from the backend. */
  readonly handoff?: HandoffRequest;
  /** Flag indicating if the request was auto-triggered due to low confidence. */
  readonly autoEscalated?: boolean;
  /** Boolean indicating whether a handoff request is being processed. */
  readonly isProcessing?: boolean;
}

/**
 * Renders the human assistance call-to-action with live status updates.
 */
export function HumanHandoff({
  onRequest,
  handoff,
  autoEscalated = false,
  isProcessing = false,
}: HumanHandoffProps): JSX.Element {
  const label = autoEscalated ? 'Escalated to a volunteer' : 'Request human assistance';

  return (
    <section className="handoff" aria-live="polite">
      <button
        type="button"
        className="handoff__button"
        onClick={() => void onRequest()}
        disabled={Boolean(handoff) || isProcessing}
      >
        {isProcessing ? 'Connecting…' : label}
      </button>
      {handoff ? (
        <p className="handoff__status">Status: {handoff.status}</p>
      ) : (
        <p className="handoff__hint">Volunteers respond in under a minute on average.</p>
      )}
    </section>
  );
}
