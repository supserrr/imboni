'use client';

/**
 * Props for {@link InCallControls}.
 */
export interface InCallControlsProps {
  /** Indicates whether the flashlight is currently enabled on the remote device. */
  readonly flashlightOn: boolean;
  /** Handler toggling the flashlight state. */
  readonly onToggleFlashlight: () => void;
  /** Handler capturing a snapshot during the call. */
  readonly onSnapshot: () => void;
  /** Handler terminating the call session. */
  readonly onEndCall: () => void;
}

/**
 * Presents context-aware controls displayed exclusively during a human handoff call.
 */
export function InCallControls({
  flashlightOn,
  onToggleFlashlight,
  onSnapshot,
  onEndCall,
}: InCallControlsProps): JSX.Element {
  return (
    <div className="incall" role="group" aria-label="In-call controls">
      <button type="button" className="incall__button" onClick={onToggleFlashlight}>
        {flashlightOn ? 'Flashlight off' : 'Flashlight on'}
      </button>
      <button type="button" className="incall__button" onClick={onSnapshot}>
        Snapshot
      </button>
      <button type="button" className="incall__button incall__button--danger" onClick={onEndCall}>
        End call
      </button>
    </div>
  );
}
