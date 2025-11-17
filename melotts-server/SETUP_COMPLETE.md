# MeloTTS Server Setup - Complete

## Status: ✅ Working

The MeloTTS HTTP API server is now running and fully functional!

### Server Information
- **URL**: http://localhost:8888
- **Status**: Running
- **MeloTTS Import**: ✅ Success
- **English TTS**: ✅ Working
- **Japanese Support**: ⚠️ Requires MeCab/unidic configuration (optional)

### Quick Start

1. **Start the server**:
   ```bash
   cd melotts-server
   python3 server.py
   ```

2. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:8888/health
   
   # Get speakers
   curl http://localhost:8888/api/speakers?language=EN
   
   # Synthesize speech
   curl -X POST http://localhost:8888/api/tts \
     -H "Content-Type: application/json" \
     -d '{"text": "Hello, this is a test", "language": "EN", "speaker": "EN-US"}' \
     --output test.wav
   ```

### API Endpoints

#### GET /health
Returns server health status and MeloTTS availability.

#### GET /api/speakers?language=EN
Returns list of available speakers for a language.

#### POST /api/tts
Synthesizes speech from text.

**Request Body**:
```json
{
  "text": "Text to synthesize",
  "language": "EN",
  "speaker": "EN-US",  // Optional
  "speed": 1.0          // Optional, default 1.0
}
```

**Response**: WAV audio file

### Configuration

The server uses MeloTTS from `/tmp/MeloTTS`. If you need to change this location, edit `server.py` and update the `melotts_path` variable.

### React Native Integration

Update your `.env` file:
```
EXPO_PUBLIC_MELOTTS_API_URL=http://localhost:8888
```

For web testing, use `http://localhost:8888` or your local IP address.

### Known Issues & Workarounds

1. **MeCab/unidic for Japanese**: Japanese language support requires proper MeCab and unidic configuration. The server will start successfully even without this, but Japanese TTS will fail. English and other languages work fine.

2. **First Request Slow**: The first TTS request may be slow as the model loads. Subsequent requests are faster.

3. **NLTK Data**: Some NLTK data may need to be downloaded on first use. The server handles this automatically.

### Troubleshooting

If the server fails to start:
1. Check that all dependencies are installed: `pip install -r requirements.txt`
2. Verify MeloTTS is accessible: `python3 -c "import sys; sys.path.insert(0, '/tmp/MeloTTS'); from melo.api import TTS; print('OK')"`
3. Check server logs: `tail -f /tmp/melotts-server.log`

### Next Steps

- Test the React Native app integration
- Configure Moondream API key for vision analysis
- Set up WebRTC for video calls

