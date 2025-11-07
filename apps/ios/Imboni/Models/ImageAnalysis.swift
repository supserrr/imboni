import Foundation

/// Describes the payload required to request image analysis from the AI service.
public struct ImageAnalysisRequest: Codable {
  /// Identifier of the user initiating the request.
  public let userId: String
  /// Base64 encoded image or a public URL referencing the asset.
  public let imageSource: String
  /// Optional follow-up question that the user wants answered about the image.
  public let prompt: String?
  /// ISO timestamp representing when the image was captured.
  public let capturedAt: String?

  /// Creates a new request payload.
  public init(userId: String, imageSource: String, prompt: String? = nil, capturedAt: String? = nil) {
    self.userId = userId
    self.imageSource = imageSource
    self.prompt = prompt
    self.capturedAt = capturedAt
  }
}

/// Represents a structured description returned by the AI model.
public struct ImageAnalysisDescription: Codable, Identifiable {
  /// Unique identifier for diffing within SwiftUI.
  public let id = UUID()
  /// Primary natural language caption summarising the scene.
  public let caption: String
  /// Individual observations extracted from the image.
  public let observations: [String]
  /// Optional textual transcription when OCR is applied.
  public let textBlocks: [String]?
}

/// Defines the confidence metrics emitted for AI generated responses.
public struct ConfidenceScore: Codable {
  /// Numeric value between 0 and 1 representing overall certainty.
  public let value: Double
  /// Plain-text explanation of how the confidence was derived.
  public let rationale: String?
}

/// Aggregates the outcome of AI processing that is shown to the user.
public struct ImageAnalysisResult: Codable, Identifiable {
  /// Unique identifier referencing the analysis record.
  public let id: String
  /// Descriptive results produced by the AI pipeline.
  public let description: ImageAnalysisDescription
  /// Confidence metrics used to decide whether to escalate to a human volunteer.
  public let confidence: ConfidenceScore
  /// Optional identifier referencing an associated volunteer handoff request.
  public let handoffRequestId: String?
  /// ISO timestamp for when the analysis completed.
  public let completedAt: String
}

/// Represents the status of a handoff request to a human volunteer.
public enum HandoffStatus: String, Codable {
  case pending
  case assigned
  case connected
  case resolved
  case cancelled
}

/// Metadata tracked for each human handoff request.
public struct HandoffRequest: Codable, Identifiable {
  /// Unique identifier for the handoff request.
  public let id: String
  /// User identifier associated with the request.
  public let userId: String
  /// Current lifecycle state for the request.
  public let status: HandoffStatus
  /// Identifier of the volunteer if already matched.
  public let volunteerId: String?
  /// ISO timestamp when the handoff was created.
  public let createdAt: String
  /// ISO timestamp when the request was resolved or cancelled.
  public let updatedAt: String?
}

/// Common error representation returned by backend services.
public struct ServiceError: Error, Codable {
  /// Machine readable error code.
  public let code: String
  /// Human readable description of the failure.
  public let message: String
  /// Optional contextual metadata for debugging.
  public let context: [String: String]?
}

/// Represents a signalling message exchanged during WebRTC setup.
public struct WebRTCSignal {
  /// Identifier of the related handoff request.
  public let handoffId: String
  /// Identifier describing the sender (user or volunteer).
  public let sender: String
  /// Raw payload forwarded to the remote peer.
  public let data: [String: Any]?
}
