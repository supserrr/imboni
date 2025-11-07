import Foundation
import Supabase

/// Provides a shared Supabase client configured for the Imboni platform.
public enum SupabaseClientProvider {
  /// Singleton instance of the Supabase client.
  public static let shared: SupabaseClient = {
    let configuration = SupabaseClientConfiguration(
      url: URL(string: Environment.supabaseUrl)!,
      anonKey: Environment.supabaseAnonKey
    )
    configuration.autoRefreshToken = true
    configuration.persistSession = true
    return SupabaseClient(configuration: configuration)
  }()

  /// Wraps the Edge Function invocation for the Moondream integration.
  /// - Parameter payload: Encoded request body describing the image to analyse.
  /// - Returns: Decoded analysis result that mirrors the JSON contract.
  public static func analyzeImage(payload: ImageAnalysisRequest) async throws -> ImageAnalysisResult {
    let response = try await shared.functions.invoke(
      "analyze-image",
      options: FunctionsFetchOptions(body: payload)
    )
    return try response.decode(ImageAnalysisResult.self)
  }

  /// Requests a human handoff by calling the dedicated Edge Function.
  /// - Parameter analysisId: Identifier referencing the AI analysis record.
  /// - Returns: Handoff request metadata suitable for UI updates.
  public static func requestHumanHandoff(analysisId: String) async throws -> HandoffRequest {
    let response = try await shared.functions.invoke(
      "request-handoff",
      options: FunctionsFetchOptions(body: ["analysisId": analysisId])
    )
    return try response.decode(HandoffRequest.self)
  }
}

/// Provides strongly typed access to the app's Supabase credentials.
public enum Environment {
  /// Supabase project URL injected at build time.
  public static var supabaseUrl: String {
    guard let value = ProcessInfo.processInfo.environment["SUPABASE_URL"] else {
      fatalError("SUPABASE_URL is missing")
    }
    return value
  }

  /// Supabase anonymous key injected at build time.
  public static var supabaseAnonKey: String {
    guard let value = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] else {
      fatalError("SUPABASE_ANON_KEY is missing")
    }
    return value
  }
}

/// Mirrors the TypeScript contract sent to the Moondream integration.
public struct ImageAnalysisRequest: Codable {
  /// Identifier of the user initiating the request.
  public let userId: String
  /// Base64 encoded payload or a public URL referencing the asset.
  public let imageSource: String
  /// Optional follow-up question provided by the user.
  public let prompt: String?
  /// ISO timestamp describing when the image was captured.
  public let capturedAt: String?

  /// Creates a new instance of the request body.
  public init(userId: String, imageSource: String, prompt: String? = nil, capturedAt: String? = nil) {
    self.userId = userId
    self.imageSource = imageSource
    self.prompt = prompt
    self.capturedAt = capturedAt
  }
}

/// Encapsulates the AI description returned by the analysis pipeline.
public struct ImageAnalysisDescription: Codable {
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
public struct ImageAnalysisResult: Codable {
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
public struct HandoffRequest: Codable {
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
