import axios from 'axios';

const BENTOML_API_URL = process.env.EXPO_PUBLIC_BENTOML_API_URL || 'http://localhost:3000';

export const bentomlApi = axios.create({
  baseURL: BENTOML_API_URL,
  timeout: 10000,
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

export const synthesizeSpeech = async (text: string): Promise<string> => {
  try {
    const response = await bentomlApi.post('/audio/tts', text, {
        headers: {
            'Content-Type': 'text/plain'
        },
        responseType: 'arraybuffer' // or blob
    });
    
    // Convert arraybuffer to base64 for playback in React Native if needed
    // Or save to file. Returning base64 is common for small clips.
    const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
    return base64Audio;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await bentomlApi.post('/ai/status', {});
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

