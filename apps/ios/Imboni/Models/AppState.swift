import Foundation
import Combine

/// Observable application state consumed by the SwiftUI hierarchy.
@MainActor
final class AppState: ObservableObject {
  /// Latest AI analysis presented to the user.
  @Published var latestAnalysis: ImageAnalysisResult?
  /// Historical records shown in the progressive disclosure panel.
  @Published var history: [ImageAnalysisResult] = []
  /// Active handoff request metadata if a volunteer is involved.
  @Published var handoff: HandoffRequest?
  /// Indicates whether an AI analysis request is currently in flight.
  @Published var isLoading = false
  /// Tracks error messages presented to the user.
  @Published var errorMessage: String?
  /// Indicates whether the system escalated automatically based on confidence.
  @Published var autoEscalated = false
  /// Indicates whether a volunteer call is connected.
  @Published var isInCall = false
  /// Flashlight state toggled during calls.
  @Published var flashlightOn = false
  /// Preferred locale for voice over and API prompts.
  @Published var locale = Locale.current.identifier

  /// Adds a result to the local history cache.
  func addToHistory(_ result: ImageAnalysisResult) {
    history.insert(result, at: 0)
    history = Array(history.prefix(10))
  }

  /// Updates the handoff metadata and adjusts call state automatically.
  func updateHandoff(_ handoff: HandoffRequest) {
    self.handoff = handoff
    switch handoff.status {
    case .connected:
      isInCall = true
    case .resolved, .cancelled:
      isInCall = false
    default:
      break
    }
  }

  /// Resets error messaging prior to executing an asynchronous operation.
  func clearError() {
    errorMessage = nil
  }
}
