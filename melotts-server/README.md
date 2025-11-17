# MeloTTS HTTP API Server

A simple HTTP wrapper for MeloTTS Python API to enable REST API access from React Native applications.

## Status

The server is running but MeloTTS import is currently failing due to a MeCab/unidic configuration issue. This affects Japanese language support but does not prevent the server from starting.

**Current Status**: Server running in degraded mode (MeloTTS not fully available)

## Setup

1. **Install MeloTTS**:
   ```bash
   cd /tmp
   git clone https://github.com/myshell-ai/MeloTTS.git
   cd MeloTTS
   pip install -e .
   python -m unidic download
   ```

2. **Install dependencies**:
   ```bash
   pip install flask flask-cors
   ```

3. **Start the server**:
   ```bash
   python3 server.py
   ```

The server will be available at `http://localhost:8888`

## API Endpoints

### Health Check
```bash
GET /health
```

Returns server status and MeloTTS availability.

### Get Available Speakers
```bash
GET /api/speakers?language=EN
```

Returns list of available speakers for a language.

### Synthesize Speech
```bash
POST /api/tts
Content-Type: application/json

{
  "text": "Text to synthesize",
  "language": "EN",
  "speaker": "EN-US",  # Optional
  "speed": 1.0  # Optional, default 1.0
}
```

Returns audio file (WAV format).

## Known Issues

- **MeCab/unidic configuration**: Japanese language support requires proper MeCab and unidic setup. The server will start in degraded mode if this is not configured, but English and other languages should work.

## Troubleshooting

If MeloTTS import fails:
1. Check that all dependencies are installed: `pip install -r requirements.txt`
2. For Japanese support, ensure MeCab and unidic are properly configured
3. Check server logs for specific error messages
