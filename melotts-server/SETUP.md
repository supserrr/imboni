# MeloTTS Server Setup Guide

## Quick Start

### Option 1: Using the provided HTTP API wrapper (Recommended)

1. **Install MeloTTS:**
   ```bash
   cd /tmp  # or any directory
   git clone https://github.com/myshell-ai/MeloTTS.git
   cd MeloTTS
   pip install -e .
   python -m unidic download
   ```

2. **Install HTTP server dependencies:**
   ```bash
   cd /Users/password/imboni/melotts-server
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   # From project root
   npm run melotts:start
   
   # Or directly
   cd melotts-server
   python server.py
   ```

The server will start on `http://localhost:8888`

### Option 2: Using Docker (if Docker is available)

1. **Build the Docker image:**
   ```bash
   git clone https://github.com/myshell-ai/MeloTTS.git
   cd MeloTTS
   docker build -t melotts .
   ```

2. **Run the container:**
   ```bash
   docker run -it -p 8888:8888 melotts
   ```

   Note: The Docker version runs the WebUI, not the HTTP API. You may need to use the HTTP wrapper approach instead.

## Testing the Server

Once the server is running, test it:

```bash
# Health check
curl http://localhost:8888/health

# Test TTS
curl -X POST http://localhost:8888/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test", "language": "EN", "speaker": "EN-US"}' \
  --output test.wav

# Get available speakers
curl http://localhost:8888/api/speakers?language=EN
```

## API Endpoints

- `POST /api/tts` - Synthesize speech
- `GET /api/speakers?language=EN` - Get available speakers
- `GET /health` - Health check

## Troubleshooting

1. **Import error for melo:**
   - Make sure MeloTTS is installed: `pip install -e .` in the MeloTTS directory
   - Make sure `python -m unidic download` has been run

2. **Port 8888 already in use:**
   - Change the port in `server.py` (line with `app.run(port=8888)`)
   - Update `EXPO_PUBLIC_MELOTTS_API_URL` in `.env` to match

3. **CORS errors:**
   - The server has CORS enabled, but if you encounter issues, check the Flask-CORS configuration

