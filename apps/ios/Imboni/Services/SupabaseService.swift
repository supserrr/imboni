import Foundation
import Supabase

/// Provides access to the Supabase client used throughout the application.
enum SupabaseService {
  /// Shared Supabase client instance used for API calls and real-time updates.
  static let client: SupabaseClient = {
    let configuration = SupabaseClientConfiguration(
      url: URL(string: Environment.supabaseUrl)!,
      anonKey: Environment.supabaseAnonKey
    )
    configuration.autoRefreshToken = true
    configuration.persistSession = true
    return SupabaseClient(configuration: configuration)
  }()

  /// Invokes the `analyze-image` edge function and decodes the response into domain models.
  /// - Parameter request: Payload describing the asset to analyse.
  /// - Returns: `ImageAnalysisResult` emitted by the backend.
  static func analyzeImage(request: ImageAnalysisRequest) async throws -> ImageAnalysisResult {
    let response = try await client.functions.invoke(
      "analyze-image",
      options: FunctionsFetchOptions(body: request)
    )
    return try response.decode(ImageAnalysisResult.self)
  }

  /// Invokes the `request-handoff` edge function to create a volunteer escalation.
  /// - Parameter analysisId: Identifier referencing the AI analysis record.
  /// - Returns: Handoff metadata stored in Supabase.
  static func requestHandoff(analysisId: String) async throws -> HandoffRequest {
    let response = try await client.functions.invoke(
      "request-handoff",
      options: FunctionsFetchOptions(body: ["analysisId": analysisId])
    )
    return try response.decode(HandoffRequest.self)
  }

  /// Subscribes to real-time updates for a specific handoff request using Supabase Realtime.
  /// - Parameters:
  ///   - handoffId: Identifier of the handoff request.
  ///   - handler: Closure invoked when the record changes.
  /// - Returns: A channel handle that can be used to terminate the subscription.
  static func observeHandoff(
    handoffId: String,
    handler: @escaping (HandoffRequest) -> Void,
    signalHandler: ((WebRTCSignal) -> Void)? = nil
  ) -> RealtimeChannel {
    client.channel("handoff:\(handoffId)")
      .on(
        RealtimeListenTypes.postgresChanges,
        event: "*",
        schema: "public",
        table: "handoff_requests",
        filter: "id=eq.\(handoffId)"
      ) { payload in
        if let json = payload.new,
           let data = try? JSONSerialization.data(withJSONObject: json, options: []),
           let handoff = try? JSONDecoder().decode(HandoffRequest.self, from: data) {
          handler(handoff)
        }
      }
      .on(.broadcast, event: "signal") { payload in
        guard
          let body = payload.payload as? [String: Any],
          let sender = body["sender"] as? String
        else { return }
        let signal = WebRTCSignal(
          handoffId: handoffId,
          sender: sender,
          data: body["data"] as? [String: String]
        )
        signalHandler?(signal)
      }
      .subscribe()
  }
}

/// Convenience helpers for accessing Supabase environment variables within the iOS app.
enum Environment {
  /// Supabase project URL injected via build settings.
  static var supabaseUrl: String {
    guard let value = ProcessInfo.processInfo.environment["SUPABASE_URL"] else {
      fatalError("SUPABASE_URL missing")
    }
    return value
  }

  /// Supabase anonymous key injected via build settings.
  static var supabaseAnonKey: String {
    guard let value = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] else {
      fatalError("SUPABASE_ANON_KEY missing")
    }
    return value
  }
}
