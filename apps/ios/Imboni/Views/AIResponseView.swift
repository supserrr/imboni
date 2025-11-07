import SwiftUI

/// Displays the AI generated response in a visually clear layout.
struct AIResponseView: View {
  /// Current AI analysis result.
  let result: ImageAnalysisResult?
  /// Indicates whether an analysis request is in progress.
  let isLoading: Bool
  /// Optional error message to present.
  let errorMessage: String?

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        Text("Instant Assistant")
          .textCase(.uppercase)
          .tracking(2)
          .font(.caption)
          .foregroundStyle(.white.opacity(0.7))
        Spacer()
        if let result {
          Text(confidenceLabel(for: result.confidence.value))
            .font(.caption2)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.purple.opacity(0.2), in: Capsule())
        }
      }

      if isLoading {
        ProgressView("Analyzing image…")
          .progressViewStyle(.circular)
      }

      if let errorMessage {
        Text(errorMessage)
          .foregroundStyle(Color.orange)
          .accessibilityLabel("Error: \(errorMessage)")
      }

      if let result {
        VStack(alignment: .leading, spacing: 8) {
          Text(result.description.caption)
            .font(.title3)
            .fontWeight(.semibold)
          if !result.description.observations.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
              ForEach(result.description.observations, id: \.self) { observation in
                Label(observation, systemImage: "sparkle")
              }
            }
          }
          if let textBlocks = result.description.textBlocks, !textBlocks.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
              Text("Detected Text")
                .font(.caption)
                .textCase(.uppercase)
                .foregroundStyle(.white.opacity(0.6))
              Text(textBlocks.joined(separator: " "))
            }
          }
        }
      } else if !isLoading {
        Text("Capture an image to receive guidance instantly.")
          .foregroundStyle(.white.opacity(0.6))
      }
    }
    .padding(20)
    .background(Color.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
    .accessibilityElement(children: .contain)
  }

  /// Computes a qualitative confidence label for a numeric value.
  /// - Parameter value: Numeric confidence between 0 and 1.
  /// - Returns: Localized string describing the confidence band.
  private func confidenceLabel(for value: Double) -> String {
    switch value {
    case 0.75...:
      return "high"
    case 0.4...:
      return "medium"
    default:
      return "low"
    }
  }
}
