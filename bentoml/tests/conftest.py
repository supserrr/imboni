"""
Pytest configuration and fixtures for testing Imboni AI service
"""
import pytest
import os
from unittest.mock import Mock, MagicMock, patch
import io

# Try to import optional dependencies
try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None
    np = None


@pytest.fixture
def mock_image():
    """
    Create a mock PIL Image for testing
    """
    if not PIL_AVAILABLE:
        pytest.skip("PIL not available")
    # Create a simple test image (100x100 RGB)
    img_array = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    return img


@pytest.fixture
def mock_image_bytes():
    """
    Create mock image bytes for testing
    """
    if not PIL_AVAILABLE:
        pytest.skip("PIL not available")
    img_array = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()


@pytest.fixture
def mock_moondream_model():
    """
    Create a mock Moondream model
    """
    mock_model = MagicMock()
    mock_model.caption.return_value = "A person holding a white cane standing on a sidewalk."
    return mock_model


@pytest.fixture
def mock_melotts_model():
    """
    Create a mock MeloTTS model
    """
    mock_model = MagicMock()
    mock_model.hps = MagicMock()
    mock_model.hps.data = MagicMock()
    mock_model.hps.data.spk2id = {
        "EN-Default": 0,
        "EN-US": 1,
        "ES-Default": 2,
        "FR-Default": 3
    }
    
    # Mock tts_to_file to create a dummy WAV file
    def mock_tts_to_file(text, speaker_id, output_path, speed=1.0):
        # Create minimal valid WAV file
        import struct
        sample_rate = 22050
        duration = 1.0
        num_samples = int(sample_rate * duration)
        
        with open(output_path, 'wb') as f:
            # WAV header
            f.write(b'RIFF')
            f.write(struct.pack('<I', 36 + num_samples * 2))
            f.write(b'WAVE')
            f.write(b'fmt ')
            f.write(struct.pack('<I', 16))  # fmt chunk size
            f.write(struct.pack('<H', 1))   # audio format (PCM)
            f.write(struct.pack('<H', 1))   # num channels
            f.write(struct.pack('<I', sample_rate))  # sample rate
            f.write(struct.pack('<I', sample_rate * 2))  # byte rate
            f.write(struct.pack('<H', 2))   # block align
            f.write(struct.pack('<H', 16))  # bits per sample
            f.write(b'data')
            f.write(struct.pack('<I', num_samples * 2))
            # Write silence
            f.write(b'\x00' * (num_samples * 2))
    
    mock_model.tts_to_file = mock_tts_to_file
    return mock_model


@pytest.fixture
def mock_audio_bytes():
    """
    Create mock WAV audio bytes
    """
    import struct
    sample_rate = 22050
    duration = 1.0
    num_samples = int(sample_rate * duration)
    
    wav_bytes = io.BytesIO()
    wav_bytes.write(b'RIFF')
    wav_bytes.write(struct.pack('<I', 36 + num_samples * 2))
    wav_bytes.write(b'WAVE')
    wav_bytes.write(b'fmt ')
    wav_bytes.write(struct.pack('<I', 16))
    wav_bytes.write(struct.pack('<H', 1))
    wav_bytes.write(struct.pack('<H', 1))
    wav_bytes.write(struct.pack('<I', sample_rate))
    wav_bytes.write(struct.pack('<I', sample_rate * 2))
    wav_bytes.write(struct.pack('<H', 2))
    wav_bytes.write(struct.pack('<H', 16))
    wav_bytes.write(b'data')
    wav_bytes.write(struct.pack('<I', num_samples * 2))
    wav_bytes.write(b'\x00' * (num_samples * 2))
    
    return wav_bytes.getvalue()


@pytest.fixture
def env_without_hf_token(monkeypatch):
    """
    Fixture to ensure HUGGINGFACE_TOKEN is not set
    """
    monkeypatch.delenv('HUGGINGFACE_TOKEN', raising=False)
    monkeypatch.delenv('HF_TOKEN', raising=False)
    return None


@pytest.fixture
def env_with_hf_token(monkeypatch):
    """
    Fixture to set a mock HUGGINGFACE_TOKEN
    """
    monkeypatch.setenv('HUGGINGFACE_TOKEN', 'test_token_12345')
    return 'test_token_12345'


@pytest.fixture
def sample_tts_payload():
    """
    Sample TTS payload for testing
    """
    return {
        "text": "Hello, this is a test.",
        "language": "EN",
        "speaker": "EN-Default",
        "speed": 1.0
    }

