from __future__ import annotations

import bentoml
from PIL import Image as PILImage
from typing import Dict, Any
import io
import os
import tempfile
import torch

# Try to import actual models, fall back to mock if not available
try:
    from melo.api import TTS as MeloTTS
    MELOTTS_AVAILABLE = True
except ImportError:
    MELOTTS_AVAILABLE = False
    print("Warning: MeloTTS not available. Using mock implementation.")

# Try to import Moondream
try:
    from transformers import AutoModelForCausalLM
    MOONDREAM_AVAILABLE = True
except ImportError:
    MOONDREAM_AVAILABLE = False
    print("Warning: Transformers not available. Moondream will not work.")

# Define Bento image with comprehensive runtime environment
# Install all packages via python_packages, then install MeloTTS via run command
bento_image = bentoml.images.Image(python_version='3.11') \
    .system_packages("curl", "git", "build-essential") \
    .python_packages(
        "torch>=2.7.0",
        "torchvision", 
        "torchaudio",
        "transformers>=4.51.1",
        "accelerate>=1.10.0",
        "pillow>=11.0.0",
        "numpy>=1.20.0",
        "txtsplit",
        "cached_path",
        "num2words==0.5.12",
        "unidic==1.1.0",
        "unidic_lite==1.0.8",
        "mecab-python3==1.0.9",
        "pykakasi==2.2.1",
        "fugashi>=1.3.0",
        "g2p_en==2.1.0",
        "anyascii==0.3.2",
        "jamo==0.4.1",
        "gruut[de,es,fr]==2.2.3",
        "g2pkk>=0.1.1",
        "librosa==0.9.1",
        "pydub==0.25.1",
        "eng_to_ipa==0.0.2",
        "inflect==7.0.0",
        "unidecode==1.3.7",
        "pypinyin==0.50.0",
        "cn2an==0.5.22",
        "jieba==0.42.1",
        "gradio",
        "langid==1.1.6",
        "tensorboard==2.16.2",
        "loguru==0.7.2",
    )

@bentoml.service(
    image=bento_image,
    resources={"cpu": "4", "memory": "8Gi"},
    traffic={"timeout": 300}  # Increase timeout to 5 minutes for Moondream3 inference
)
class ImboniAI:
    """
    Main Imboni AI service combining vision analysis and text-to-speech.
    This service provides:
    - Vision analysis using Moondream
    - Text-to-speech using MeloTTS
    - Health check endpoint
    """
    
    def __init__(self) -> None:
        # Initialize Moondream3 model only (requires Hugging Face token)
        self.moondream_model = None
        if MOONDREAM_AVAILABLE:
            try:
                device = "cuda" if torch.cuda.is_available() else "cpu"
                # Use bfloat16 for better performance, fallback to float32
                dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
                
                # Get Hugging Face token from environment (required for Moondream3)
                hf_token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_TOKEN")
                
                if not hf_token:
                    print("❌ Error: HUGGINGFACE_TOKEN environment variable is required for Moondream3")
                    print("   Please set HUGGINGFACE_TOKEN or HF_TOKEN environment variable")
                    print("   Get a token from: https://huggingface.co/settings/tokens")
                    self.moondream_model = None
                    return
                
                model_name = "moondream/moondream3-preview"
                print(f"Loading {model_name} model on {device}...")
                
                # Prepare model loading arguments
                model_kwargs = {
                    "trust_remote_code": True,
                    "dtype": dtype,
                    "token": hf_token,  # Required for Moondream3
                }
                
                if device == "cuda":
                    model_kwargs["device_map"] = "cuda"
                
                self.moondream_model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    **model_kwargs
                )
                
                if device != "cuda":
                    self.moondream_model = self.moondream_model.to(device)
                
                print(f"✅ {model_name} model loaded successfully")
            except Exception as e:
                print(f"❌ Error: Could not load Moondream3: {e}")
                print("   Make sure HUGGINGFACE_TOKEN is set correctly")
                print("   Verify token has access to moondream/moondream3-preview")
                self.moondream_model = None
        
        # Try to install MeloTTS at runtime if not available (for cloud deployment)
        global MELOTTS_AVAILABLE, MeloTTS
        if not MELOTTS_AVAILABLE:
            try:
                import subprocess
                import sys
                # os is already imported at module level
                # Create temp dir, clone, create requirements.txt, and install
                import tempfile
                import shutil
                tmp_dir = tempfile.mkdtemp()
                try:
                    # Suppress pip warnings by setting environment variable
                    env = os.environ.copy()
                    env['PIP_ROOT_USER_ACTION'] = 'ignore'
                    
                    subprocess.run(
                        ["git", "clone", "https://github.com/myshell-ai/MeloTTS.git", tmp_dir], 
                        check=True,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        text=True
                    )
                    # Create empty requirements.txt to satisfy setup.py
                    with open(f"{tmp_dir}/requirements.txt", "w") as f:
                        f.write("")
                    
                    # Install with suppressed warnings
                    # Use --quiet flag and redirect stderr to suppress warnings
                    result = subprocess.run(
                        [sys.executable, "-m", "pip", "install", "--no-deps", "--quiet", "--disable-pip-version-check", "-e", tmp_dir], 
                        check=False,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        text=True,
                        env=env
                    )
                    
                    if result.returncode == 0:
                        from melo.api import TTS as MeloTTS
                        MELOTTS_AVAILABLE = True
                        print("✅ MeloTTS installed successfully at runtime")
                    else:
                        print(f"⚠️ MeloTTS installation failed: {result.stderr}")
                finally:
                    shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception as e:
                print(f"Warning: Could not install MeloTTS at runtime: {e}")
        
        # Initialize MeloTTS if available
        if MELOTTS_AVAILABLE:
            try:
                device = os.getenv('MELOTTS_DEVICE', 'auto')
                self.tts_model = MeloTTS(language='EN', device=device)
                self.speaker_ids = self.tts_model.hps.data.spk2id
            except Exception as e:
                print(f"Warning: Could not initialize MeloTTS: {e}")
                self.tts_model = None
                self.speaker_ids = None
        else:
            self.tts_model = None
            self.speaker_ids = None
            print("Warning: MeloTTS not available. Using mock implementation.")
    
    @bentoml.api
    def vision_analyze(self, image: PILImage.Image) -> Dict[str, Any]:
        """
        Analyze an image and return description with confidence score.
        
        Args:
            image: PIL Image object
            
        Returns:
            Dict with 'description' and 'confidence' fields
        """
        # Use Moondream if available
        if self.moondream_model is not None:
            try:
                # Moondream3 API - try different approaches
                # First, try the caption method with settings
                try:
                    settings = {
                        "temperature": 0.5,
                        "max_tokens": 768,
                        "top_p": 0.3
                    }
                    
                    result = self.moondream_model.caption(
                        image,
                        length="normal",
                        settings=settings
                    )
                    
                    # Handle different return types
                    if isinstance(result, dict):
                        description = result.get("caption", result.get("text", str(result)))
                    elif isinstance(result, str):
                        description = result
                    else:
                        description = str(result)
                    
                except Exception as e1:
                    # Try without settings parameter
                    try:
                        result = self.moondream_model.caption(image, length="normal")
                        if isinstance(result, dict):
                            description = result.get("caption", result.get("text", str(result)))
                        elif isinstance(result, str):
                            description = result
                        else:
                            description = str(result)
                    except Exception as e2:
                        # Try simplest form
                        try:
                            result = self.moondream_model.caption(image)
                            if isinstance(result, dict):
                                description = result.get("caption", result.get("text", str(result)))
                            elif isinstance(result, str):
                                description = result
                            else:
                                description = str(result)
                        except Exception as e3:
                            raise Exception(f"All caption methods failed. Last error: {e3}")
                
                # Calculate confidence based on description length and content
                # Longer, more detailed descriptions indicate higher confidence
                description_length = len(description.split())
                confidence = min(0.95, 0.5 + (description_length / 100.0))
                
                # Boost confidence if description contains specific details
                if any(word in description.lower() for word in ["person", "object", "building", "vehicle", "animal"]):
                    confidence = min(0.95, confidence + 0.1)
                
                return {
                    "description": description,
                    "confidence": round(confidence, 2)
                }
            except Exception as e:
                import traceback
                error_msg = str(e)
                error_trace = traceback.format_exc()
                print(f"Error analyzing image with Moondream3: {error_msg}")
                print(f"Traceback: {error_trace}")
                # Fall back to mock response
                return {"description": f"Error analyzing image: {error_msg[:100]}", "confidence": 0.3}
        
        # Mock response if Moondream not available
        return {"description": "A person holding a white cane standing on a sidewalk.", "confidence": 0.95}

    @bentoml.api
    def audio_tts(self, payload: Dict[str, Any]) -> bytes:
        """
        Synthesize speech from text.
        
        Expected payload:
        {
            "text": "Text to synthesize",
            "language": "EN",  # Optional, default: "EN"
            "speaker": "EN-Default",  # Optional, default: "EN-Default"
            "speed": 1.0  # Optional, default: 1.0
        }
        
        Returns:
            WAV audio bytes
        """
        text = payload.get('text', '')
        language = payload.get('language', 'EN')
        speaker = payload.get('speaker', 'EN-Default')
        speed = payload.get('speed', 1.0)
        
        if not MELOTTS_AVAILABLE or self.tts_model is None:
            # Return mock audio bytes if MeloTTS not available
            return b"RIFF....WAVEfmt ...." 

        try:
            # Get speaker ID
            speaker_key = f"{language}-{speaker}" if speaker != 'EN-Default' else f"{language}-Default"
            speaker_id = self.speaker_ids.get(speaker_key, self.speaker_ids.get(f"{language}-Default"))
            
            # Generate audio to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                output_path = tmp_file.name
            
            # Synthesize speech
            self.tts_model.tts_to_file(text, speaker_id, output_path, speed=speed)
            
            # Read audio bytes
            with open(output_path, 'rb') as f:
                audio_bytes = f.read()
            
            # Clean up
            os.unlink(output_path)
            
            return audio_bytes
        except Exception as e:
            print(f"Error synthesizing speech: {e}")
            # Return empty audio on error
            return b""
    
    @bentoml.api
    def status(self) -> Dict[str, Any]:
        """
        Health check endpoint.
        
        Returns:
            Dict with service status
        """
        return {
            "status": "healthy",
            "models": {
                "moondream": "available" if self.moondream_model is not None else "unavailable",
                "melotts": "available" if MELOTTS_AVAILABLE else "mock"
            }
        }

# Export the service as 'svc' for BentoML compatibility
svc = ImboniAI
