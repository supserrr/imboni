# Moondream3 Setup Guide

## Overview

The service now supports Moondream3 (preview) with automatic fallback to Moondream2. Moondream3 requires a Hugging Face access token.

## Getting a Hugging Face Token

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Give it a name (e.g., "imboni-moondream3")
4. Select "Read" permissions (write not needed)
5. Copy the token

## Setting the Token

### For Local Development

```bash
export HUGGINGFACE_TOKEN=your_token_here
# or
export HF_TOKEN=your_token_here
```

### For BentoML Cloud Deployment

#### Option 1: Environment Variable in Deployment

When deploying or updating:

```bash
bentoml deployment update --bento imboniai:latest imboni-ai \
  --env HUGGINGFACE_TOKEN=your_token_here
```

#### Option 2: Set in BentoCloud Dashboard

1. Go to https://cloud.bentoml.com/deployments/imboni-ai
2. Click on your deployment
3. Go to "Settings" or "Environment Variables"
4. Add:
   - Key: `HUGGINGFACE_TOKEN`
   - Value: `your_token_here`
5. Save and restart the deployment

#### Option 3: Using bentoml deployment update

```bash
bentoml deployment update imboni-ai \
  --env HUGGINGFACE_TOKEN=your_token_here
```

## Model Selection Logic

The service will:

1. **First try Moondream3** if `HUGGINGFACE_TOKEN` is set
2. **Fallback to Moondream2** if:
   - No token is provided
   - Moondream3 fails to load
   - Authentication fails

## Verification

Check the deployment logs to see which model loaded:

```
✅ moondream/moondream3-preview model loaded successfully
```

or

```
✅ Moondream2 model loaded successfully
```

## Model Differences

### Moondream3
- **Better performance** and accuracy
- **Requires**: Hugging Face token + Nvidia GPU (24GB+ recommended)
- **Model size**: Larger (~1.5GB+)
- **Access**: Preview/early access

### Moondream2
- **Public access** (no token needed)
- **Works on**: CPU and GPU
- **Model size**: Smaller
- **Good performance** for most use cases

## Troubleshooting

### "401 Unauthorized" Error
- Verify your token is valid
- Check token has "Read" permissions
- Ensure token is set correctly in environment

### Model Fails to Load
- Check deployment logs for specific error
- Verify GPU availability (for Moondream3)
- Service will automatically fallback to Moondream2

### Slow Loading
- First load downloads the model (~1.5GB)
- Subsequent restarts are faster (model cached)
- Consider using Moondream2 if speed is critical

## Security Notes

- **Never commit tokens to git**
- Use environment variables or secure secret management
- Rotate tokens periodically
- Use read-only tokens (not write permissions)

