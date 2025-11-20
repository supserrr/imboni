"""
Unit tests for ImboniAI service class
"""
import pytest
from unittest.mock import Mock, MagicMock, patch, mock_open
import os
import tempfile
import sys

# Try to import dependencies, skip tests if not available
try:
    from PIL import Image
    import numpy as np
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import bentoml
    BENTOML_AVAILABLE = True
except ImportError:
    BENTOML_AVAILABLE = False

# Import the service
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

if BENTOML_AVAILABLE:
    try:
        from service import ImboniAI, MELOTTS_AVAILABLE, MOONDREAM_AVAILABLE
        SERVICE_AVAILABLE = True
    except ImportError:
        SERVICE_AVAILABLE = False
else:
    SERVICE_AVAILABLE = False

pytestmark = pytest.mark.skipif(not SERVICE_AVAILABLE, reason="Service dependencies not available")


@pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL not available")
class TestImboniAIInitialization:
    """Test service initialization"""
    
    @patch.dict(os.environ, {}, clear=True)
    @patch('service.AutoModelForCausalLM')
    @patch('service.torch')
    def test_init_without_hf_token(self, mock_torch, mock_model_class):
        """Test initialization without Hugging Face token"""
        mock_torch.cuda.is_available.return_value = False
        mock_torch.float32 = 'float32'
        
        service = ImboniAI()
        
        assert service.moondream_model is None
        mock_model_class.from_pretrained.assert_not_called()
    
    @patch.dict(os.environ, {'HUGGINGFACE_TOKEN': 'test_token'})
    @patch('service.AutoModelForCausalLM')
    @patch('service.torch')
    def test_init_with_hf_token_cpu(self, mock_torch, mock_model_class):
        """Test initialization with HF token on CPU"""
        mock_torch.cuda.is_available.return_value = False
        mock_torch.float32 = 'float32'
        mock_model_instance = MagicMock()
        mock_model_class.from_pretrained.return_value = mock_model_instance
        
        service = ImboniAI()
        
        mock_model_class.from_pretrained.assert_called_once()
        call_kwargs = mock_model_class.from_pretrained.call_args[1]
        assert call_kwargs['token'] == 'test_token'
        assert call_kwargs['dtype'] == 'float32'
        # On CPU, model.to(device) is called, so check the model is set
        assert service.moondream_model is not None
    
    @patch.dict(os.environ, {'HUGGINGFACE_TOKEN': 'test_token'})
    @patch('service.AutoModelForCausalLM')
    @patch('service.torch')
    def test_init_with_hf_token_gpu(self, mock_torch, mock_model_class):
        """Test initialization with HF token on GPU"""
        mock_torch.cuda.is_available.return_value = True
        mock_torch.bfloat16 = 'bfloat16'
        mock_model_instance = MagicMock()
        mock_model_class.from_pretrained.return_value = mock_model_instance
        
        service = ImboniAI()
        
        call_kwargs = mock_model_class.from_pretrained.call_args[1]
        assert call_kwargs['dtype'] == 'bfloat16'
        assert 'device_map' in call_kwargs
        assert call_kwargs['device_map'] == 'cuda'


@pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL not available")
class TestVisionAnalyze:
    """Test vision_analyze endpoint"""
    
    def test_vision_analyze_with_moondream(self, mock_image, mock_moondream_model):
        """Test vision analysis with Moondream model"""
        service = ImboniAI()
        service.moondream_model = mock_moondream_model
        
        result = service.vision_analyze(mock_image)
        
        assert 'description' in result
        assert 'confidence' in result
        assert isinstance(result['description'], str)
        assert isinstance(result['confidence'], float)
        assert 0.0 <= result['confidence'] <= 1.0
        mock_moondream_model.caption.assert_called()
    
    def test_vision_analyze_without_moondream(self, mock_image):
        """Test vision analysis without Moondream (fallback to mock)"""
        service = ImboniAI()
        service.moondream_model = None
        
        result = service.vision_analyze(mock_image)
        
        assert 'description' in result
        assert 'confidence' in result
        assert result['confidence'] == 0.95
        assert "person holding a white cane" in result['description'].lower()
    
    def test_vision_analyze_moondream_error_handling(self, mock_image, mock_moondream_model):
        """Test error handling when Moondream fails"""
        service = ImboniAI()
        mock_moondream_model.caption.side_effect = Exception("Model error")
        service.moondream_model = mock_moondream_model
        
        result = service.vision_analyze(mock_image)
        
        assert 'description' in result
        assert 'confidence' in result
        assert result['confidence'] == 0.3
        assert "Error" in result['description']
    
    def test_vision_analyze_confidence_calculation(self, mock_image, mock_moondream_model):
        """Test confidence score calculation"""
        service = ImboniAI()
        # Mock a detailed description
        mock_moondream_model.caption.return_value = (
            "A person holding a white cane standing on a sidewalk near a building. "
            "There is a vehicle in the background and an animal visible."
        )
        service.moondream_model = mock_moondream_model
        
        result = service.vision_analyze(mock_image)
        
        # Should have higher confidence due to detailed description
        assert result['confidence'] > 0.5


class TestAudioTTS:
    """Test audio_tts endpoint"""
    
    @patch('service.MELOTTS_AVAILABLE', True)
    def test_audio_tts_with_melotts(self, sample_tts_payload, mock_melotts_model):
        """Test TTS with MeloTTS available"""
        service = ImboniAI()
        # Wrap tts_to_file in a MagicMock to track calls
        original_tts_to_file = mock_melotts_model.tts_to_file
        mock_melotts_model.tts_to_file = MagicMock(side_effect=original_tts_to_file)
        service.tts_model = mock_melotts_model
        service.speaker_ids = mock_melotts_model.hps.data.spk2id
        
        result = service.audio_tts(sample_tts_payload)
        
        assert isinstance(result, bytes)
        assert len(result) > 0
        assert result.startswith(b'RIFF')
        assert mock_melotts_model.tts_to_file.called
    
    def test_audio_tts_without_melotts(self, sample_tts_payload):
        """Test TTS without MeloTTS (fallback to mock)"""
        service = ImboniAI()
        service.tts_model = None
        
        result = service.audio_tts(sample_tts_payload)
        
        assert isinstance(result, bytes)
        assert result == b"RIFF....WAVEfmt ...."
    
    @patch('service.MELOTTS_AVAILABLE', True)
    def test_audio_tts_default_parameters(self, mock_melotts_model):
        """Test TTS with default parameters"""
        service = ImboniAI()
        # Wrap tts_to_file in a MagicMock to track calls
        original_tts_to_file = mock_melotts_model.tts_to_file
        mock_melotts_model.tts_to_file = MagicMock(side_effect=original_tts_to_file)
        service.tts_model = mock_melotts_model
        service.speaker_ids = mock_melotts_model.hps.data.spk2id
        
        payload = {"text": "Test"}
        result = service.audio_tts(payload)
        
        assert isinstance(result, bytes)
        # Verify defaults were used - check call was made with speed=1.0
        assert mock_melotts_model.tts_to_file.called
        call_kwargs = mock_melotts_model.tts_to_file.call_args[1]
        assert call_kwargs.get('speed', 1.0) == 1.0
    
    @patch('service.MELOTTS_AVAILABLE', True)
    def test_audio_tts_custom_parameters(self, mock_melotts_model):
        """Test TTS with custom parameters"""
        service = ImboniAI()
        # Wrap tts_to_file in a MagicMock to track calls
        original_tts_to_file = mock_melotts_model.tts_to_file
        mock_melotts_model.tts_to_file = MagicMock(side_effect=original_tts_to_file)
        service.tts_model = mock_melotts_model
        service.speaker_ids = mock_melotts_model.hps.data.spk2id
        
        payload = {
            "text": "Test",
            "language": "ES",
            "speaker": "ES-Default",
            "speed": 1.5
        }
        result = service.audio_tts(payload)
        
        assert isinstance(result, bytes)
        assert mock_melotts_model.tts_to_file.called
        call_kwargs = mock_melotts_model.tts_to_file.call_args[1]
        assert call_kwargs.get('speed') == 1.5
    
    @patch('service.MELOTTS_AVAILABLE', True)
    def test_audio_tts_error_handling(self, sample_tts_payload, mock_melotts_model):
        """Test TTS error handling"""
        service = ImboniAI()
        # Make tts_to_file raise an exception
        mock_melotts_model.tts_to_file = MagicMock(side_effect=Exception("TTS error"))
        service.tts_model = mock_melotts_model
        service.speaker_ids = mock_melotts_model.hps.data.spk2id
        
        result = service.audio_tts(sample_tts_payload)
        
        assert isinstance(result, bytes)
        assert result == b""  # Empty bytes on error
    
    @patch('service.MELOTTS_AVAILABLE', True)
    def test_audio_tts_empty_text(self, mock_melotts_model):
        """Test TTS with empty text"""
        service = ImboniAI()
        service.tts_model = mock_melotts_model
        service.speaker_ids = mock_melotts_model.hps.data.spk2id
        
        payload = {"text": ""}
        result = service.audio_tts(payload)
        
        assert isinstance(result, bytes)


class TestStatus:
    """Test status endpoint"""
    
    def test_status_with_models_available(self, mock_moondream_model, mock_melotts_model):
        """Test status when both models are available"""
        service = ImboniAI()
        service.moondream_model = mock_moondream_model
        service.tts_model = mock_melotts_model
        
        with patch('service.MELOTTS_AVAILABLE', True):
            result = service.status()
        
        assert result['status'] == 'healthy'
        assert result['models']['moondream'] == 'available'
        assert result['models']['melotts'] == 'available'
    
    def test_status_without_models(self):
        """Test status when models are not available"""
        service = ImboniAI()
        service.moondream_model = None
        service.tts_model = None
        
        with patch('service.MELOTTS_AVAILABLE', False):
            result = service.status()
        
        assert result['status'] == 'healthy'
        assert result['models']['moondream'] == 'unavailable'
        assert result['models']['melotts'] == 'mock'
    
    def test_status_partial_availability(self, mock_moondream_model):
        """Test status with partial model availability"""
        service = ImboniAI()
        service.moondream_model = mock_moondream_model
        service.tts_model = None
        
        with patch('service.MELOTTS_AVAILABLE', False):
            result = service.status()
        
        assert result['status'] == 'healthy'
        assert result['models']['moondream'] == 'available'
        assert result['models']['melotts'] == 'mock'

