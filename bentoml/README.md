# BentoML Service for Imboni AI

This service provides AI-powered vision analysis and text-to-speech capabilities for the Imboni app.

## Features

- **Vision Analysis**: Uses Moondream3 (or Moondream2 as fallback) for image understanding
- **Text-to-Speech**: Uses MeloTTS for natural voice synthesis

## Setup

### Prerequisites

1. Python 3.11+
2. BentoML installed
3. (Optional) Hugging Face token for Moondream3 access

### Installation

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -U bentoml
```

3. Build the service:
```bash
bentoml build service.py:svc
```

## Configuration

### Hugging Face Token (for Moondream3)

To use Moondream3 instead of Moondream2, you need a Hugging Face access token:

1. Generate a token at: https://huggingface.co/settings/tokens
2. Set it as an environment variable:
   ```bash
   export HUGGINGFACE_TOKEN=your_token_here
   # or
   export HF_TOKEN=your_token_here
   ```

3. For BentoML Cloud deployment, set it in the deployment settings or as an environment variable.

### Deployment

1. Login to BentoML Cloud:
```bash
bentoml cloud login
```

2. Deploy:
```bash
bentoml deploy -n imboni-ai
```

3. Update existing deployment:
```bash
bentoml deployment update --bento imboniai:latest imboni-ai
```

## API Endpoints

### POST /vision_analyze
Analyze an image and return description with confidence score.

**Input**: Multipart form data with `image` field (PIL Image)

**Response**:
```json
{
  "description": "A detailed description of the image",
  "confidence": 0.95
}
```

### POST /audio_tts
Synthesize speech from text.

**Input**:
```json
{
  "payload": {
    "text": "Text to synthesize",
    "language": "EN",
    "speaker": "EN-Default",
    "speed": 1.0
  }
}
```

**Response**: WAV audio bytes

### POST /status
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "models": {
    "moondream": "available",
    "melotts": "available"
  }
}
```

## Model Information

### Moondream3
- **Model**: `moondream/moondream3-preview`
- **Requirements**: Hugging Face token with access
- **Hardware**: Nvidia GPUs with 24GB+ memory recommended
- **Fallback**: Automatically falls back to Moondream2 if token not available

### Moondream2
- **Model**: `vikhyatk/moondream2`
- **Requirements**: No authentication needed
- **Hardware**: Works on CPU and GPU

### MeloTTS
- **Source**: GitHub (https://github.com/myshell-ai/MeloTTS)
- **Installation**: Installed at runtime if not available during build
- **Languages**: EN, ES, FR, ZH, JP, KR

## Troubleshooting

### Moondream3 Access
If you get authentication errors:
1. Verify your Hugging Face token is valid
2. Check that the token has read access
3. Ensure the token is set in the environment: `echo $HUGGINGFACE_TOKEN`

### MeloTTS Installation
If MeloTTS fails to install:
- Check deployment logs for errors
- The service will use mock TTS if installation fails
- First request may take longer while MeloTTS installs

## Development

### Local Testing
```bash
# Start service locally
bentoml serve service.py:svc

# Test endpoints
curl -X POST http://localhost:3000/status -H "Content-Type: application/json" -d '{}'
```

### Building
```bash
bentoml build service.py:svc
```

### Viewing Local Bentos
```bash
bentoml list
```
