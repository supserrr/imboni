#!/usr/bin/env python3
"""
MeloTTS HTTP API Server
A simple HTTP wrapper for MeloTTS Python API to enable REST API access.
"""

import sys
import os

# Add MeloTTS to path (adjust if installed elsewhere)
melotts_path = '/tmp/MeloTTS'
if os.path.exists(melotts_path):
    sys.path.insert(0, melotts_path)

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import io
import tempfile
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

# Import MeloTTS with error handling
try:
    from melo.api import TTS
    MELOTTS_AVAILABLE = True
except Exception as e:
    print(f"Warning: MeloTTS import failed: {e}")
    print("Server will start but TTS functionality will be limited.")
    MELOTTS_AVAILABLE = False
    TTS = None

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native app

# Initialize TTS models (lazy load on first request)
tts_models = {}

def get_tts_model(language: str):
    """Get or create TTS model for a language."""
    if not MELOTTS_AVAILABLE:
        raise RuntimeError("MeloTTS is not available. Please check installation.")
    if language not in tts_models:
        device = 'auto'  # Will automatically use GPU if available
        tts_models[language] = TTS(language=language, device=device)
    return tts_models[language]

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok' if MELOTTS_AVAILABLE else 'degraded',
        'service': 'MeloTTS API',
        'melotts_available': MELOTTS_AVAILABLE
    })

@app.route('/api/tts', methods=['POST'])
def synthesize():
    """
    Synthesize speech from text.
    
    Request body:
    {
        "text": "Text to synthesize",
        "language": "EN",
        "speaker": "EN-US",  # Optional
        "speed": 1.0  # Optional, default 1.0
    }
    
    Returns: Audio file (WAV format)
    """
    try:
        if not MELOTTS_AVAILABLE:
            return jsonify({
                'error': 'MeloTTS is not available. Please check installation and ensure all dependencies are installed.'
            }), 503
        
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400
        
        text = data['text']
        language = data.get('language', 'EN')
        speaker = data.get('speaker')
        speed = float(data.get('speed', 1.0))
        
        # Get TTS model
        model = get_tts_model(language)
        speaker_ids = model.hps.data.spk2id
        
        # Determine speaker ID
        # speaker_ids is a dict-like HParams object that supports keys() and dict access
        speaker_keys = list(speaker_ids.keys())
        
        if speaker and speaker in speaker_keys:
            speaker_id = speaker_ids[speaker]
        elif language in speaker_keys:
            speaker_id = speaker_ids[language]
        else:
            # Use first available speaker for the language
            if speaker_keys:
                speaker_id = speaker_ids[speaker_keys[0]]
            else:
                return jsonify({'error': 'No speaker available for the specified language'}), 400
        
        # Generate speech to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            output_path = tmp_file.name
        
        model.tts_to_file(text, speaker_id, output_path, speed=speed)
        
        # Return audio file
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=False,
            download_name='speech.wav'
        )
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"TTS Error: {e}")
        print(error_trace)
        return jsonify({'error': str(e), 'traceback': error_trace}), 500
    finally:
        # Clean up temporary file
        if 'output_path' in locals() and os.path.exists(output_path):
            try:
                os.unlink(output_path)
            except:
                pass

@app.route('/api/speakers', methods=['GET'])
def get_speakers():
    """
    Get available speakers for a language.
    
    Query params:
    - language: Language code (EN, ES, FR, ZH, JP, KR)
    
    Returns: List of available speaker IDs
    """
    try:
        if not MELOTTS_AVAILABLE:
            # Return default speakers if MeloTTS not available
            language = request.args.get('language', 'EN')
            if language == 'EN':
                return jsonify({
                    'language': language,
                    'speakers': ['EN-Default', 'EN-US', 'EN-BR', 'EN_INDIA', 'EN-AU']
                })
            return jsonify({
                'language': language,
                'speakers': [language]
            })
        
        language = request.args.get('language', 'EN')
        model = get_tts_model(language)
        speaker_ids = model.hps.data.spk2id
        
        return jsonify({
            'language': language,
            'speakers': list(speaker_ids.keys())
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting MeloTTS HTTP API Server...")
    print("API will be available at http://localhost:8888")
    print("Endpoints:")
    print("  POST /api/tts - Synthesize speech")
    print("  GET /api/speakers?language=EN - Get available speakers")
    print("  GET /health - Health check")
    app.run(host='0.0.0.0', port=8888, debug=True)

