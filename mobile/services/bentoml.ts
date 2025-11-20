import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_BENTOML_API_URL || '';

export interface VisionAnalysisResponse {
  description: string;
  confidence: number;
}

export const BentoMLService = {
  async analyzeImage(imageUri: string): Promise<VisionAnalysisResponse> {
    const formData = new FormData();
    
    // Prepare the image file object for FormData
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore - React Native FormData expects this structure
    formData.append('image', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: filename,
      type,
    });

    try {
      const response = await fetch(`${BASE_URL}/vision_analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Vision analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('BentoML Vision Error:', error);
      throw error;
    }
  },

  async synthesizeSpeech(text: string, language: string = 'EN'): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${BASE_URL}/audio_tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            payload: {
                text,
                language,
                speaker: `${language}-Default`,
                speed: 1.0,
            }
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('BentoML TTS Error:', error);
      throw error;
    }
  },
};

