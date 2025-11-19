# BentoML Cloud Deployment Guide

## Prerequisites

1. BentoML installed and up to date
2. BentoML Cloud account
3. Service built successfully

## Step 1: Login to BentoML Cloud

Run the following command and follow the interactive prompts:

```bash
cd bentoml-service
source venv/bin/activate  # On Windows: venv\Scripts\activate
bentoml cloud login
```

You'll be prompted to:
- Choose authentication method (browser or paste token)
- If using browser: A URL will open for you to authenticate
- If using token: Paste your API token when prompted

## Step 2: Build the Bento

Build your service into a Bento:

```bash
bentoml build service.py:svc
```

This will:
- Package all dependencies
- Create a Bento artifact
- Prepare it for deployment

## Step 3: Deploy to BentoCloud

### Option A: Deploy directly (builds, pushes, and deploys automatically)

```bash
bentoml deploy -n imboni-ai
```

This single command will:
1. Build the Bento (if not already built)
2. Push it to BentoCloud
3. Deploy it on BentoCloud
4. Provision instances
5. Start the service

### Option B: Deploy an existing Bento

If you already have a Bento built locally:

```bash
# List local Bentos
bentoml list

# Deploy a specific Bento
bentoml deploy imboniai:latest -n imboni-ai
```

### Option C: Push first, deploy later

If you want to push the Bento to BentoCloud but deploy later:

```bash
# Push to BentoCloud
bentoml push imboniai:latest

# Deploy later from BentoCloud console or CLI
bentoml deploy imboniai:latest -n imboni-ai
```

## Step 4: Monitor Deployment

After running `bentoml deploy`, you'll see real-time status updates in your terminal. The deployment process includes:

1. **Building**: Packaging your service
2. **Pushing**: Uploading to BentoCloud
3. **Containerizing**: Creating OCI-compliant image
4. **Provisioning**: Setting up cloud instances
5. **Starting**: Launching the service

## Step 5: Access Your Deployment

Once deployment is complete, you'll receive:
- Deployment URL
- API endpoints
- Status information

You can also view and manage your deployment in the [BentoCloud Console](https://cloud.bentoml.com).

## Testing the Deployment

Once deployed, you can test the endpoints:

```python
import bentoml

# Replace with your actual deployment URL
with bentoml.SyncHTTPClient('<your_deployment_url>') as client:
    # Test vision analysis
    # (You'll need to send an image - implementation depends on your client setup)
    
    # Test TTS
    result = client.audio_tts({
        "text": "Hello, this is a test.",
        "language": "EN",
        "speaker": "EN-Default",
        "speed": 1.0
    })
    
    # Test health check
    status = client.status()
    print(f"Status: {status}")
```

## Troubleshooting

### Build Issues

If build fails:
- Check that all dependencies are correctly specified
- Ensure MeloTTS can be installed from GitHub
- Verify Python version compatibility (3.11)

### Deployment Issues

If deployment fails:
- Verify you're logged in: `bentoml cloud whoami`
- Check BentoCloud console for error messages
- Ensure you have sufficient quota/resources

### Runtime Issues

If service fails at runtime:
- Check logs in BentoCloud console
- Verify all dependencies are installed correctly
- Ensure models can be loaded (MeloTTS, Moondream)

## Environment Variables

You can set environment variables for your deployment:

```bash
bentoml deploy -n imboni-ai --env MELOTTS_DEVICE=cpu
```

Or configure them in the BentoCloud console after deployment.

## Updating Deployment

To update an existing deployment:

```bash
# Rebuild with changes
bentoml build service.py:svc

# Redeploy (will update existing deployment)
bentoml deploy imboniai:latest -n imboni-ai
```

## Service Endpoints

Once deployed, your service will have these endpoints:

- `POST /vision_analyze` - Analyze images
- `POST /audio_tts` - Synthesize speech
- `POST /status` - Health check

## Next Steps

1. Complete `bentoml cloud login`
2. Run `bentoml build service.py:svc` (if not already done)
3. Run `bentoml deploy -n imboni-ai`
4. Update your `.env` file with the deployment URL
5. Test the endpoints from your mobile app

