import SwiftUI

/// Minimal settings sheet exposing language preference.
struct SettingsView: View {
  /// Currently selected locale identifier.
  @Binding var locale: String
  /// Handler executed when the sheet should close.
  let onClose: () -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack {
        Text("Settings")
          .font(.title2)
          .fontWeight(.semibold)
        Spacer()
        Button("Close", action: onClose)
          .font(.caption)
      }

      Picker("Preferred language", selection: $locale) {
        Text("English").tag("en")
        Text("French").tag("fr")
        Text("Spanish").tag("es")
        Text("German").tag("de")
      }
      .pickerStyle(.menu)

      Text("Additional preferences will appear here as we expand the app.")
        .font(.footnote)
        .foregroundStyle(.white.opacity(0.7))
    }
    .padding(24)
    .background(Color.black.opacity(0.85), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
  }
}
