import SwiftUI

/// Context-aware controls displayed during a volunteer call.
struct InCallView: View {
  /// Indicates whether the flashlight is currently enabled.
  let flashlightOn: Bool
  /// Handler toggling the flashlight.
  let onToggleFlashlight: () -> Void
  /// Handler capturing a snapshot.
  let onSnapshot: () -> Void
  /// Handler terminating the call.
  let onEndCall: () -> Void

  var body: some View {
    HStack(spacing: 12) {
      Button(action: onToggleFlashlight) {
        Label(flashlightOn ? "Flashlight off" : "Flashlight on", systemImage: flashlightOn ? "bolt.slash" : "bolt")
      }
      .buttonStyle(CallControlStyle(background: .blue.opacity(0.2)))

      Button(action: onSnapshot) {
        Label("Snapshot", systemImage: "camera")
      }
      .buttonStyle(CallControlStyle(background: .purple.opacity(0.2)))

      Button(action: onEndCall) {
        Label("End call", systemImage: "phone.down")
      }
      .buttonStyle(CallControlStyle(background: .red.opacity(0.35)))
      .accessibilityLabel("End volunteer call")
    }
  }
}

/// Button style shared across call control actions for consistent visuals.
struct CallControlStyle: ButtonStyle {
  /// Background tint applied to the button.
  let background: Color

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .padding(.vertical, 12)
      .padding(.horizontal, 16)
      .background(background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
      .foregroundStyle(.white)
      .opacity(configuration.isPressed ? 0.6 : 1)
  }
}
