import SwiftUI

/// Renders the call-to-action for escalating to a human volunteer.
struct HumanHandoffView: View {
  /// Callback executed when the user taps the request button.
  let onRequest: () -> Void
  /// Current handoff metadata if present.
  let handoff: HandoffRequest?
  /// Indicates whether the escalation was triggered by low confidence.
  let autoEscalated: Bool
  /// Indicates whether the request is in progress.
  let isProcessing: Bool

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Button(action: onRequest) {
        Text(buttonLabel)
          .frame(maxWidth: .infinity)
          .padding()
          .background(LinearGradient(colors: [.pink, .orange], startPoint: .topLeading, endPoint: .bottomTrailing))
          .foregroundColor(.black)
          .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
      }
      .disabled(handoff != nil || isProcessing)
      .accessibilityLabel(buttonLabel)
      .accessibilityHint("Connect with a volunteer for additional assistance")

      Text(statusText)
        .font(.footnote)
        .foregroundStyle(.white.opacity(0.7))
    }
  }

  private var buttonLabel: String {
    if isProcessing {
      return "Connecting…"
    }
    if autoEscalated {
      return "Escalated to volunteer"
    }
    return "Request human assistance"
  }

  private var statusText: String {
    if let handoff {
      return "Status: \(handoff.status.rawValue)"
    }
    return "Volunteers respond in under a minute on average."
  }
}
