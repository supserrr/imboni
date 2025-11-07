import SwiftUI
import AVFoundation

/// Handles camera preview and still image capture using `AVFoundation`.
@MainActor
final class CameraController: NSObject, ObservableObject, AVCapturePhotoCaptureDelegate {
  /// Published error message displayed by the UI when capture fails.
  @Published var errorMessage: String?
  /// Underlying capture session.
  private let session = AVCaptureSession()
  /// Photo output used to capture still images.
  private let output = AVCapturePhotoOutput()
  /// Completion handler invoked when a photo capture finishes.
  private var captureCompletion: ((Result<Data, Error>) -> Void)?

  /// Configures the capture session for photo use.
  func configureSession() {
    session.beginConfiguration()
    session.sessionPreset = .photo

    guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
      errorMessage = "No camera available."
      session.commitConfiguration()
      return
    }

    do {
      let input = try AVCaptureDeviceInput(device: device)
      if session.canAddInput(input) {
        session.addInput(input)
      }
      if session.canAddOutput(output) {
        session.addOutput(output)
      }
      session.commitConfiguration()
      session.startRunning()
    } catch {
      errorMessage = error.localizedDescription
      session.commitConfiguration()
    }
  }

  /// Stops the capture session and frees hardware resources.
  func stopSession() {
    session.stopRunning()
  }

  /// Initiates a still photo capture.
  /// - Parameter completion: Closure receiving the JPEG data or an error.
  func capturePhoto(completion: @escaping (Result<Data, Error>) -> Void) {
    captureCompletion = completion
    let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
    output.capturePhoto(with: settings, delegate: self)
  }

  func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
    if let error {
      captureCompletion?(.failure(error))
    } else if let data = photo.fileDataRepresentation() {
      captureCompletion?(.success(data))
    } else {
      captureCompletion?(.failure(NSError(domain: "imboni.camera", code: -1, userInfo: [NSLocalizedDescriptionKey: "Unable to capture image."])))
    }
  }

  /// Provides access to the configured capture session.
  func makeSession() -> AVCaptureSession {
    session
  }
}

/// UIKit backed view that renders the live camera preview.
struct CameraPreview: UIViewRepresentable {
  /// Camera controller managing the capture session.
  let controller: CameraController

  func makeUIView(context: Context) -> PreviewView {
    let view = PreviewView()
    view.session = controller.makeSession()
    return view
  }

  func updateUIView(_ uiView: PreviewView, context: Context) {}
}

/// Custom preview view bridging `AVCaptureVideoPreviewLayer` into SwiftUI.
final class PreviewView: UIView {
  override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
  var videoPreviewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
  var session: AVCaptureSession? {
    get { videoPreviewLayer.session }
    set { videoPreviewLayer.session = newValue }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
    videoPreviewLayer.videoGravity = .resizeAspectFill
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

/// SwiftUI wrapper exposing the camera experience used on the home screen.
struct CameraCaptureView: View {
  /// Callback invoked when a capture completes.
  let onCapture: (Data) async -> Void
  /// Shared camera controller instance.
  @StateObject private var controller = CameraController()
  /// Indicates whether the capture button is disabled due to a running operation.
  @State private var isCapturing = false

  var body: some View {
    VStack(spacing: 16) {
      ZStack {
        CameraPreview(controller: controller)
          .accessibilityHidden(true)
          .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
          .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
              .stroke(Color.white.opacity(0.2), lineWidth: 1)
          )

        if let error = controller.errorMessage {
          Text(error)
            .multilineTextAlignment(.center)
            .padding()
            .background(Color.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .foregroundColor(.white)
        }
      }
      .frame(height: 320)

      Button {
        isCapturing = true
        controller.capturePhoto { result in
          Task {
            switch result {
            case let .success(data):
              await onCapture(data)
            case let .failure(error):
              controller.errorMessage = error.localizedDescription
            }
            isCapturing = false
          }
        }
      } label: {
        Text(isCapturing ? "Capturing…" : "Capture")
          .frame(maxWidth: .infinity)
          .padding()
          .background(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
          .foregroundColor(.black)
          .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
      }
      .disabled(isCapturing)
      .accessibilityLabel("Capture image")
    }
    .task {
      controller.configureSession()
    }
    .onDisappear {
      controller.stopSession()
    }
  }
}
