# Imboni Backend Services

This repository contains the backend services for the Imboni visual assistance platform:

- **BentoML Service**: AI-powered vision analysis and text-to-speech
- **Supabase**: Database schema and migrations for user management, help requests, and sessions

## Services Overview

### BentoML Service

Provides AI-powered vision analysis and text-to-speech capabilities:

- **Vision Analysis**: Uses Moondream3 (or Moondream2 fallback) for image understanding
- **Text-to-Speech**: Uses MeloTTS for natural voice synthesis
- **API Endpoints**:
  - `POST /vision_analyze` - Analyze images and return descriptions
  - `POST /audio_tts` - Synthesize speech from text
  - `POST /status` - Health check endpoint

See `bentoml/README.md` for detailed documentation.

### Supabase

PostgreSQL database with real-time capabilities for:

- **Authentication**: User management via Supabase Auth
- **Database Tables**:
  - `users` - User profiles (blind/volunteer types)
  - `help_requests` - Help request matching system
  - `sessions` - Video call session tracking
  - `volunteer_behavior` - Volunteer metrics and ratings
- **Real-time Subscriptions**: Live updates for help requests and sessions
- **Row Level Security**: Database-level security policies

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Quick Start

### Prerequisites

- Python 3.11+ (for BentoML service)
- Supabase account
- (Optional) Hugging Face token for Moondream3

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# BentoML API Configuration (for client applications)
BENTOML_API_URL=your_bentoml_api_url

# Hugging Face Token (for Moondream3)
HUGGINGFACE_TOKEN=your_huggingface_token

# MeloTTS Device Configuration (optional)
MELOTTS_DEVICE=auto
```

### BentoML Service Setup

```bash
cd bentoml

# Linux/macOS:
./setup.sh

# Windows:
setup.bat

# Or manually:
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -U bentoml
bentoml build service.py:svc
```

See `bentoml/README.md` for detailed setup and deployment instructions.

### Supabase Setup

Apply the database schema:

```bash
# Via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the contents of supabase/migrations/001_initial_schema.sql

# Or via Supabase CLI:
supabase db push
```

## Project Structure

```
imboni/
├── bentoml/                 # BentoML AI service
│   ├── service.py           # Main service implementation
│   ├── requirements.txt     # Python dependencies
│   ├── bentofile.yaml       # BentoML configuration
│   └── README.md            # Service documentation
├── supabase/                # Database migrations
│   └── migrations/
│       └── 001_initial_schema.sql
├── env.example              # Environment variables template
└── README.md               # This file
```

## Deployment

### BentoML Service

Deploy to BentoML Cloud:

```bash
cd bentoml
bentoml cloud login
bentoml deploy -n imboni-ai
```

See `bentoml/DEPLOYMENT.md` for detailed deployment instructions.

### Supabase

Supabase is a cloud-hosted service. Your database runs on Supabase's infrastructure. Migrations can be applied via:
- Supabase Dashboard SQL Editor
- Supabase CLI (`supabase db push`)

## API Documentation

### BentoML Endpoints

#### POST /vision_analyze

Analyze an image and return description with confidence score.

**Input**: Multipart form data with `image` field (PIL Image)

**Response**:
```json
{
  "description": "A detailed description of the image",
  "confidence": 0.95
}
```

#### POST /audio_tts

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

#### POST /status

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

### Supabase Tables

See `supabase/migrations/001_initial_schema.sql` for complete schema documentation.

## Development

### Local BentoML Service

```bash
cd bentoml
source venv/bin/activate
bentoml serve service.py:svc
```

Service will be available at `http://localhost:3000`

### Testing Endpoints

```bash
# Health check
curl -X POST http://localhost:3000/status -H "Content-Type: application/json" -d '{}'
```

## License

Private project
