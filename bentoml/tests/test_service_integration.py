"""
Integration tests for ImboniAI service API endpoints
"""
import pytest
import requests
import time
import subprocess
import os
import sys
from pathlib import Path
from PIL import Image
import numpy as np
import io
import json


@pytest.fixture(scope="session")
def service_url():
    """
    Get the service URL from environment or use default
    """
    return os.getenv("BENTOML_TEST_URL", "http://localhost:3000")


@pytest.fixture(scope="session")
def service_process():
    """
    Start the BentoML service for integration testing
    """
    service_dir = Path(__file__).parent.parent
    env = os.environ.copy()
    
    # Start service in background
    process = subprocess.Popen(
        [sys.executable, "-m", "bentoml", "serve", "service.py:svc", "--port", "3000"],
        cwd=service_dir,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for service to start
    max_attempts = 30
    for _ in range(max_attempts):
        try:
            response = requests.post(
                f"http://localhost:3000/status",
                json={},
                timeout=2
            )
            if response.status_code == 200:
                break
        except requests.exceptions.RequestException:
            time.sleep(1)
    else:
        process.terminate()
        pytest.fail("Service failed to start within timeout")
    
    yield process
    
    # Cleanup
    process.terminate()
    process.wait(timeout=10)


@pytest.mark.integration
class TestStatusEndpoint:
    """Integration tests for /status endpoint"""
    
    def test_status_endpoint_available(self, service_url):
        """Test that status endpoint is accessible"""
        response = requests.post(
            f"{service_url}/status",
            json={},
            timeout=10
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'status' in data
        assert 'models' in data
        assert data['status'] == 'healthy'
    
    def test_status_response_structure(self, service_url):
        """Test status response structure"""
        response = requests.post(
            f"{service_url}/status",
            json={},
            timeout=10
        )
        
        data = response.json()
        assert isinstance(data['models'], dict)
        assert 'moondream' in data['models']
        assert 'melotts' in data['models']


@pytest.mark.integration
class TestVisionAnalyzeEndpoint:
    """Integration tests for /vision_analyze endpoint"""
    
    def create_test_image(self):
        """Create a test image"""
        img_array = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        return img
    
    def test_vision_analyze_endpoint(self, service_url):
        """Test vision analyze endpoint with image"""
        img = self.create_test_image()
        
        # Convert image to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'image': ('test.png', img_bytes, 'image/png')}
        
        response = requests.post(
            f"{service_url}/vision_analyze",
            files=files,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'description' in data
        assert 'confidence' in data
        assert isinstance(data['description'], str)
        assert isinstance(data['confidence'], (int, float))
        assert 0.0 <= data['confidence'] <= 1.0
    
    def test_vision_analyze_with_jpeg(self, service_url):
        """Test vision analyze with JPEG image"""
        img = self.create_test_image()
        
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        files = {'image': ('test.jpg', img_bytes, 'image/jpeg')}
        
        response = requests.post(
            f"{service_url}/vision_analyze",
            files=files,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'description' in data
        assert 'confidence' in data
    
    def test_vision_analyze_invalid_request(self, service_url):
        """Test vision analyze with invalid request"""
        # Send request without image
        response = requests.post(
            f"{service_url}/vision_analyze",
            json={},
            timeout=10
        )
        
        # Should return error (400 or 422)
        assert response.status_code in [400, 422, 500]


@pytest.mark.integration
class TestAudioTTSEndpoint:
    """Integration tests for /audio_tts endpoint"""
    
    def test_audio_tts_endpoint(self, service_url):
        """Test TTS endpoint with valid payload"""
        payload = {
            "payload": {
                "text": "Hello, this is a test.",
                "language": "EN",
                "speaker": "EN-Default",
                "speed": 1.0
            }
        }
        
        response = requests.post(
            f"{service_url}/audio_tts",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        assert response.headers['content-type'].startswith('audio/') or \
               response.headers['content-type'] == 'application/octet-stream'
        assert len(response.content) > 0
    
    def test_audio_tts_default_parameters(self, service_url):
        """Test TTS with minimal payload (using defaults)"""
        payload = {
            "payload": {
                "text": "Test"
            }
        }
        
        response = requests.post(
            f"{service_url}/audio_tts",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        assert len(response.content) > 0
    
    def test_audio_tts_custom_speed(self, service_url):
        """Test TTS with custom speed"""
        payload = {
            "payload": {
                "text": "This is a speed test.",
                "speed": 1.5
            }
        }
        
        response = requests.post(
            f"{service_url}/audio_tts",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        assert len(response.content) > 0
    
    def test_audio_tts_empty_text(self, service_url):
        """Test TTS with empty text"""
        payload = {
            "payload": {
                "text": ""
            }
        }
        
        response = requests.post(
            f"{service_url}/audio_tts",
            json=payload,
            timeout=60
        )
        
        # Should handle gracefully (may return empty audio or error)
        assert response.status_code in [200, 400, 422]
    
    def test_audio_tts_invalid_payload(self, service_url):
        """Test TTS with invalid payload structure"""
        payload = {
            "text": "Missing payload wrapper"
        }
        
        response = requests.post(
            f"{service_url}/audio_tts",
            json=payload,
            timeout=10
        )
        
        # Should return error
        assert response.status_code in [400, 422, 500]


@pytest.mark.integration
class TestEndpointsTogether:
    """Test multiple endpoints together"""
    
    def test_full_workflow(self, service_url):
        """Test a complete workflow: analyze image, then synthesize description"""
        # Step 1: Analyze image
        img_array = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'image': ('test.png', img_bytes, 'image/png')}
        
        vision_response = requests.post(
            f"{service_url}/vision_analyze",
            files=files,
            timeout=60
        )
        
        assert vision_response.status_code == 200
        vision_data = vision_response.json()
        description = vision_data['description']
        
        # Step 2: Synthesize the description
        tts_payload = {
            "payload": {
                "text": description,
                "language": "EN",
                "speed": 1.0
            }
        }
        
        tts_response = requests.post(
            f"{service_url}/audio_tts",
            json=tts_payload,
            timeout=60
        )
        
        assert tts_response.status_code == 200
        assert len(tts_response.content) > 0

