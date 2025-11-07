/**
 * Describes the payload required to request image analysis from the AI service.
 */
export interface ImageAnalysisRequest {
  /** Identifier of the user initiating the request. */
  readonly userId: string;
  /** Base64 encoded image or a public URL referencing the asset. */
  readonly imageSource: string;
  /** Optional follow-up question that the user wants answered about the image. */
  readonly prompt?: string;
  /** ISO timestamp representing when the image was captured. */
  readonly capturedAt?: string;
}

/**
 * Represents a structured description returned by the AI model.
 */
export interface ImageAnalysisDescription {
  /** Primary natural language caption summarising the scene. */
  readonly caption: string;
  /** Individual observations extracted from the image. */
  readonly observations: readonly string[];
  /** Optional textual transcription when OCR is applied. */
  readonly textBlocks?: readonly string[];
}

/**
 * Defines the confidence metrics emitted for AI generated responses.
 */
export interface ConfidenceScore {
  /** Numeric value between 0 and 1 representing overall certainty. */
  readonly value: number;
  /** Plain-text explanation of how the confidence was derived. */
  readonly rationale?: string;
}

/**
 * Aggregates the outcome of AI processing that is shown to the user.
 */
export interface ImageAnalysisResult {
  /** Unique identifier referencing the analysis record. */
  readonly id: string;
  /** Descriptive results produced by the AI pipeline. */
  readonly description: ImageAnalysisDescription;
  /** Confidence metrics used to decide whether to escalate to a human volunteer. */
  readonly confidence: ConfidenceScore;
  /** Optional identifier referencing an associated volunteer handoff request. */
  readonly handoffRequestId?: string;
  /** ISO timestamp for when the analysis completed. */
  readonly completedAt: string;
}

/**
 * Represents the status of a handoff request to a human volunteer.
 */
export type HandoffStatus =
  | 'pending'
  | 'assigned'
  | 'connected'
  | 'resolved'
  | 'cancelled';

/**
 * Metadata tracked for each human handoff request.
 */
export interface HandoffRequest {
  /** Unique identifier for the handoff request. */
  readonly id: string;
  /** User identifier associated with the request. */
  readonly userId: string;
  /** Current lifecycle state for the request. */
  readonly status: HandoffStatus;
  /** Identifier of the volunteer if already matched. */
  readonly volunteerId?: string;
  /** ISO timestamp when the handoff was created. */
  readonly createdAt: string;
  /** ISO timestamp when the request was resolved or cancelled. */
  readonly updatedAt?: string;
}

/**
 * Represents a volunteer that can be connected with a user.
 */
export interface VolunteerProfile {
  /** Unique volunteer identifier. */
  readonly id: string;
  /** Supported locale codes the volunteer can speak. */
  readonly locales: readonly string[];
  /** Availability flag indicating whether the volunteer can receive calls. */
  readonly available: boolean;
}

/**
 * Common error representation returned by backend services.
 */
export interface ServiceError {
  /** Machine readable error code. */
  readonly code: string;
  /** Human readable description of the failure. */
  readonly message: string;
  /** Optional contextual metadata for debugging. */
  readonly context?: Record<string, string | number | boolean>;
}

/**
 * Represents a signalling message transmitted between peers during WebRTC setup.
 */
export interface WebRTCSignal {
  /** Identifier of the related handoff request. */
  readonly handoffId: string;
  /** Identifier describing the sender (user or volunteer). */
  readonly sender: string;
  /** Raw payload forwarded to the remote peer. */
  readonly data: unknown;
}
