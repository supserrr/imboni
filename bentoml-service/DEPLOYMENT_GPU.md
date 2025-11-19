# GPU Deployment Guide for Moondream3

Moondream3 requires GPU resources for efficient inference. This guide shows how to deploy with GPU support on BentoCloud.

## Requirements

- **GPU Memory**: At least 24GB VRAM (NVIDIA GPU recommended)
- **GPU Type**: NVIDIA T4, A10, or similar
- **BentoCloud Account**: With GPU quota enabled

## Deployment Options

### Option 1: Deploy with GPU via CLI (Recommended)

```bash
cd bentoml-service
source venv/bin/activate

# Build the Bento
bentoml build service.py:svc

# Deploy with GPU resources
bentoml deployment update imboni-ai \
  --bento imboniai:latest \
  --env HUGGINGFACE_TOKEN=your_token_here \
  --resource-instance-type gpu.t4.1xlarge \
  --resource-gpu 1
```

### Option 2: Deploy via BentoCloud Dashboard

1. Go to https://cloud.bentoml.com/deployments
2. Select your deployment `imboni-ai`
3. Click "Update" or "Edit"
4. Under "Resources", select:
   - **Instance Type**: GPU instance (e.g., `gpu.t4.1xlarge`)
   - **GPU Count**: 1
   - **GPU Type**: NVIDIA T4 (or available GPU type)
5. Set environment variable:
   - `HUGGINGFACE_TOKEN`: Your Hugging Face token
6. Click "Deploy"

### Option 3: Use Python API

```python
import bentoml

deployment = bentoml.deployment.get("imboni-ai")
deployment.update(
    bento="imboniai:latest",
    env={"HUGGINGFACE_TOKEN": "your_token_here"},
    resource_instance_type="gpu.t4.1xlarge",
    resource_gpu=1
)
```

## Available GPU Instance Types

Common GPU instance types on BentoCloud:
- `gpu.t4.1xlarge` - NVIDIA T4, 1 GPU, ~16GB VRAM
- `gpu.t4.2xlarge` - NVIDIA T4, 2 GPUs, ~32GB VRAM total
- `gpu.a10.1xlarge` - NVIDIA A10, 1 GPU, ~24GB VRAM (recommended for Moondream3)
- `gpu.a10.2xlarge` - NVIDIA A10, 2 GPUs, ~48GB VRAM total

## Verify GPU Access

After deployment, check if GPU is available:

```bash
# Check deployment status
bentoml deployment get imboni-ai

# Test the status endpoint
curl -X POST https://your-deployment-url/status \
  -H "Content-Type: application/json" \
  -d '{}'
```

The service will automatically detect and use GPU if available. Check logs to confirm:
- Look for "Loading moondream/moondream3-preview model on cuda..."
- Inference should complete in < 10 seconds with GPU

## Cost Considerations

- GPU instances are more expensive than CPU instances
- Consider using GPU only for production workloads
- For development/testing, CPU with increased timeout (300s) can work but is slow

## Troubleshooting

### GPU Not Available

If GPU is not available:
1. Check your BentoCloud quota
2. Verify GPU instance type is available in your region
3. Contact BentoML support to enable GPU access

### Still Timing Out

If requests still timeout with GPU:
1. Check deployment logs for errors
2. Verify model is loading on GPU (check logs for "cuda")
3. Increase timeout further if needed (max 600s)

### Fallback to CPU

If GPU deployment fails, the service will fall back to CPU:
- Inference will be slow (30-60+ seconds)
- Timeout is set to 300 seconds
- Consider using smaller images or model quantization

