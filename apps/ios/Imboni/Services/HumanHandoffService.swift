import Foundation
import Supabase

/// Coordinates human volunteer handoff requests and real-time updates.
struct HumanHandoffService {
  /// Triggers a volunteer request for the given analysis identifier.
  /// - Parameter analysisId: Identifier referencing the AI analysis result.
  /// - Returns: Metadata describing the created handoff request.
  static func request(analysisId: String) async throws -> HandoffRequest {
    try await SupabaseService.requestHandoff(analysisId: analysisId)
  }

  /// Observes real-time changes for a handoff request.
  /// - Parameters:
  ///   - handoffId: Identifier to subscribe to.
  ///   - handler: Closure invoked when the record changes.
  /// - Returns: Channel reference that should be retained while observing.
  static func observe(
    handoffId: String,
    handler: @escaping (HandoffRequest) -> Void,
    signalHandler: ((WebRTCSignal) -> Void)? = nil
  ) -> RealtimeChannel {
    SupabaseService.observeHandoff(handoffId: handoffId, handler: handler, signalHandler: signalHandler)
  }
}
