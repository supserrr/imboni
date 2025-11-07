import SwiftUI
import Supabase
import UIKit
import WebRTC

private let confidenceThreshold = 0.55

/// Root view orchestrating camera capture, AI feedback, and human handoff flows.
struct ContentView: View {
  /// Shared application state stored as an observable object.
  @StateObject private var state = AppState()
  /// Controls the visibility of the history sheet.
  @State private var showHistory = false
  /// Controls the visibility of the settings sheet.
  @State private var showSettings = false
  /// Realtime subscription handle retained while a handoff is active.
  @State private var realtimeChannel: RealtimeChannel?
  /// WebRTC service managing peer connection.
  @State private var webRTCService: WebRTCService?
  /// Description of the remote media stream for accessibility feedback.
  @State private var remoteStreamDescription: String?

  var body: some View {
    ZStack {
      LinearGradient(colors: [.black, Color(red: 0.07, green: 0.11, blue: 0.17)], startPoint: .top, endPoint: .bottom)
        .ignoresSafeArea()

      ScrollView {
        VStack(spacing: 24) {
          header

          CameraCaptureView { data in
            await analyze(data: data)
          }

          AIResponseView(result: state.latestAnalysis, isLoading: state.isLoading, errorMessage: state.errorMessage)

          HumanHandoffView(
            onRequest: { Task { await requestHandoff() } },
            handoff: state.handoff,
            autoEscalated: state.autoEscalated,
            isProcessing: state.isLoading
          )

          if let remoteStreamDescription {
            Text(remoteStreamDescription)
              .font(.footnote)
              .foregroundStyle(.white.opacity(0.7))
              .accessibilityLabel("Remote video stream active")
          }

          if state.isInCall {
            InCallView(
              flashlightOn: state.flashlightOn,
              onToggleFlashlight: toggleFlashlight,
              onSnapshot: snapshot,
              onEndCall: endCall
            )
          }
        }
        .padding(24)
      }
    }
    .sheet(isPresented: $showHistory) {
      HistoryView(entries: state.history) {
        showHistory = false
      }
      .presentationDetents([.medium, .large])
      .presentationBackgroundInteraction(.enabled)
    }
    .sheet(isPresented: $showSettings) {
      SettingsView(locale: $state.locale) {
        showSettings = false
      }
      .presentationDetents([.medium])
    }
    .onChange(of: state.handoff?.status) { _, status in
      guard let status, let handoff = state.handoff else { return }
      if status == .connected {
        startWebRTC(for: handoff)
      }
      if status == .resolved || status == .cancelled {
        stopWebRTC()
      }
    }
    .onDisappear {
      if let realtimeChannel {
        SupabaseService.client.remove(channel: realtimeChannel)
      }
      stopWebRTC()
    }
  }

  /// Header presenting quick-access controls.
  private var header: some View {
    HStack {
      Spacer()
      Button("Recent") {
        showHistory = true
      }
      .buttonStyle(.borderedProminent)

      Button("Settings") {
        showSettings = true
      }
      .buttonStyle(.bordered)
      .tint(.white.opacity(0.4))
    }
  }

  /// Performs AI analysis and updates state accordingly.
  /// - Parameter data: Raw JPEG data captured from the camera.
  private func analyze(data: Data) async {
    await MainActor.run {
      state.isLoading = true
      state.clearError()
      state.autoEscalated = false
    }

    do {
      let base64 = data.base64EncodedString()
      let request = ImageAnalysisRequest(
        userId: "demo-user",
        imageSource: base64,
        prompt: nil,
        capturedAt: ISO8601DateFormatter().string(from: Date())
      )
      let result = try await MoondreamService.analyze(data: request)

      await MainActor.run {
        state.latestAnalysis = result
        state.addToHistory(result)
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
      }

      if result.confidence.value < confidenceThreshold {
        await MainActor.run {
          state.autoEscalated = true
          UINotificationFeedbackGenerator().notificationOccurred(.warning)
        }
        await requestHandoff(for: result.id)
      }
    } catch {
      await MainActor.run {
        state.errorMessage = error.localizedDescription
        UINotificationFeedbackGenerator().notificationOccurred(.error)
      }
    }

    await MainActor.run {
      state.isLoading = false
    }
  }

  /// Requests a human handoff for the latest analysis result.
  /// - Parameter analysisId: Optional identifier overriding the latest analysis.
  private func requestHandoff(for analysisId: String? = nil) async {
    guard let identifier = analysisId ?? state.latestAnalysis?.id else {
      await MainActor.run {
        state.errorMessage = "No analysis available for handoff."
      }
      return
    }

    do {
      let handoff = try await HumanHandoffService.request(analysisId: identifier)
      await MainActor.run {
        state.updateHandoff(handoff)
      }

      realtimeChannel = HumanHandoffService.observe(handoffId: handoff.id, handler: { update in
        Task { @MainActor in
          state.updateHandoff(update)
        }
      }, signalHandler: { signal in
        Task {
          try? await webRTCService?.handleSignal(signal.data ?? [:])
        }
      })
    } catch {
      await MainActor.run {
        state.errorMessage = error.localizedDescription
        UINotificationFeedbackGenerator().notificationOccurred(.error)
      }
    }
  }

  /// Convenience wrapper invoked by the handoff button.
  private func requestHandoff() async {
    await requestHandoff(for: nil)
  }

  /// Toggles the flashlight state within the app (stubbed in the prototype).
  private func toggleFlashlight() {
    state.flashlightOn.toggle()
  }

  /// Persists a snapshot of the current analysis into history.
  private func snapshot() {
    if let analysis = state.latestAnalysis {
      state.addToHistory(analysis)
    }
  }

  /// Ends the active volunteer call and cleans up state.
  private func endCall() {
    stopWebRTC()
    state.isInCall = false
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    if let handoff = state.handoff {
      state.updateHandoff(HandoffRequest(
        id: handoff.id,
        userId: handoff.userId,
        status: .resolved,
        volunteerId: handoff.volunteerId,
        createdAt: handoff.createdAt,
        updatedAt: ISO8601DateFormatter().string(from: Date())
      ))
    }
  }

  /// Starts the WebRTC service when a volunteer connects.
  private func startWebRTC(for handoff: HandoffRequest) {
    guard webRTCService == nil else { return }
    let service = WebRTCService(handoffId: handoff.id)
    service.onRemoteStream = { stream in
      Task { @MainActor in
        remoteStreamDescription = "Remote stream with \(stream.videoTracks.count) video track(s)."
        UIAccessibility.post(notification: .announcement, argument: "Volunteer video connected")
      }
    }
    webRTCService = service
    Task {
      try? await service.start()
    }
  }

  /// Stops the WebRTC service and clears remote stream metadata.
  private func stopWebRTC() {
    webRTCService?.stop()
    webRTCService = nil
    remoteStreamDescription = nil
  }
}
