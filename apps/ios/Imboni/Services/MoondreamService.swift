import Foundation

/// Service responsible for orchestrating AI analysis calls via Supabase Edge Functions.
struct MoondreamService {
  /// Performs image analysis by delegating to the Supabase edge function.
  /// - Parameter data: Encoded request body describing the image.
  /// - Returns: Parsed `ImageAnalysisResult` value.
  static func analyze(data: ImageAnalysisRequest) async throws -> ImageAnalysisResult {
    try await SupabaseService.analyzeImage(request: data)
  }
}
