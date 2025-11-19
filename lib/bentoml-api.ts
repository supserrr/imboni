import axios from 'axios';
import { Buffer } from 'buffer';

const BENTOML_API_URL = process.env.EXPO_PUBLIC_BENTOML_API_URL || 'http://localhost:3000';

export const bentomlApi = axios.create({
  baseURL: BENTOML_API_URL,
  timeout: 60000, // Increased timeout for GPU inference (can take up to 10s)
});

export interface AnalysisResult {
  description: string;
  confidence: number;
}

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // BentoML Image input often expects raw bytes or multipart form data
    // For simplicity here, assuming the service can handle base64 or we construct a FormData
    const formData = new FormData();
    formData.append('image', {
      uri: `data:image/jpeg;base64,${base64Image}`,
      type: 'image/jpeg',
      name: 'frame.jpg',
    } as any);

    const response = await bentomlApi.post('/vision/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

export interface TTSPayload {
  text: string;
  language?: string;
  speaker?: string;
  speed?: number;
}

export const synthesizeSpeech = async (
  text: string, 
  language: string = 'EN', 
  speaker: string = 'EN-Default',
  speed: number = 1.0
): Promise<string> => {
  try {
    const payload: TTSPayload = {
      text,
      language,
      speaker,
      speed,
    };
    
    // BentoML v1.4 expects the parameter name as a field in the JSON body
    const response = await bentomlApi.post('/audio_tts', { payload }, {
        headers: {
            'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
    });
    
    // Convert arraybuffer to base64 for playback in React Native
    const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
    return base64Audio;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await bentomlApi.post('/status', {});
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

