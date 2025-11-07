import SwiftUI

/// Slide-over panel listing previous AI interactions.
struct HistoryView: View {
  /// Historical entries sorted by completion date.
  let entries: [ImageAnalysisResult]
  /// Callback executed when the panel should dismiss.
  let onClose: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack {
        Text("Recent")
          .textCase(.uppercase)
          .tracking(2)
          .font(.caption)
          .foregroundStyle(.white.opacity(0.7))
        Spacer()
        Button("Close", action: onClose)
          .font(.caption)
      }

      ScrollView {
        VStack(alignment: .leading, spacing: 12) {
          ForEach(entries) { entry in
            VStack(alignment: .leading, spacing: 6) {
              Text(formatted(dateString: entry.completedAt))
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.6))
              Text(entry.description.caption)
                .font(.body)
            }
            .padding(.bottom, 8)
            .overlay(alignment: .bottom) {
              Divider().background(Color.white.opacity(0.1))
            }
          }
        }
      }
    }
    .padding(20)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.black.opacity(0.85))
  }

  private func formatted(dateString: String) -> String {
    guard let date = ISO8601DateFormatter().date(from: dateString) else { return dateString }
    return date.formatted(date: .abbreviated, time: .shortened)
  }
}
