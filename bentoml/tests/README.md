# Imboni BentoML Service Test Suite

Comprehensive test suite for the Imboni AI service, covering unit tests, integration tests, and database schema validation.

## Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── conftest.py                 # Pytest fixtures and configuration
├── test_service_unit.py        # Unit tests for service class
├── test_service_integration.py # Integration tests for API endpoints
├── test_database_schema.py     # Database schema validation tests
├── requirements.txt            # Test dependencies
├── run_tests.sh               # Test runner script (Linux/macOS)
├── run_tests.bat             # Test runner script (Windows)
└── README.md                 # This file
```

## Test Categories

### Unit Tests (`test_service_unit.py`)

Tests individual components of the service in isolation:

- Service initialization with/without Hugging Face token
- Vision analysis endpoint logic
- Text-to-speech endpoint logic
- Status endpoint
- Error handling and edge cases
- Model availability detection

**Run unit tests:**
```bash
pytest tests/test_service_unit.py -v
```

### Integration Tests (`test_service_integration.py`)

Tests the full API endpoints with a running service:

- Status endpoint availability
- Vision analyze endpoint with images
- Audio TTS endpoint with various payloads
- End-to-end workflows
- Error handling for invalid requests

**Prerequisites:** BentoML service must be running

**Run integration tests:**
```bash
# Start service first
bentoml serve service.py:svc

# In another terminal
pytest tests/test_service_integration.py -v -m integration
```

### Database Schema Tests (`test_database_schema.py`)

Validates the Supabase database schema:

- Table definitions
- Column types and constraints
- Foreign key relationships
- RLS policies
- Functions and triggers
- Realtime publication setup
- SQL syntax validation

**Run schema tests:**
```bash
pytest tests/test_database_schema.py -v
```

## Setup

### Install Test Dependencies

```bash
cd bentoml
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r tests/requirements.txt
```

### Environment Variables

For integration tests, you may need to set:

```bash
export BENTOML_TEST_URL=http://localhost:3000  # Default
```

## Running Tests

### Using Test Runner Scripts

**Linux/macOS:**
```bash
# Run all tests with coverage
./tests/run_tests.sh all

# Run only unit tests
./tests/run_tests.sh unit

# Run without coverage
./tests/run_tests.sh all false
```

**Windows:**
```cmd
REM Run all tests with coverage
tests\run_tests.bat all

REM Run only unit tests
tests\run_tests.bat unit

REM Run without coverage
tests\run_tests.bat all false
```

### Using Pytest Directly

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=service --cov-report=html

# Run specific test file
pytest tests/test_service_unit.py -v

# Run specific test class
pytest tests/test_service_unit.py::TestVisionAnalyze -v

# Run specific test
pytest tests/test_service_unit.py::TestVisionAnalyze::test_vision_analyze_with_moondream -v

# Run only unit tests (exclude integration)
pytest tests/ -v -m "not integration"

# Run only integration tests
pytest tests/ -v -m integration
```

## Test Coverage

Generate coverage reports:

```bash
pytest tests/ --cov=service --cov-report=html --cov-report=term-missing
```

View HTML coverage report:
```bash
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r bentoml/requirements.txt
          pip install -r bentoml/tests/requirements.txt
      - name: Run unit tests
        run: |
          cd bentoml
          pytest tests/test_service_unit.py tests/test_database_schema.py -v
      - name: Run integration tests
        run: |
          cd bentoml
          pytest tests/test_service_integration.py -v -m integration
        env:
          BENTOML_TEST_URL: ${{ secrets.BENTOML_TEST_URL }}
```

## Writing New Tests

### Unit Test Example

```python
def test_new_feature(self, mock_fixture):
    """Test description"""
    service = ImboniAI()
    result = service.new_method()
    assert result == expected_value
```

### Integration Test Example

```python
@pytest.mark.integration
def test_new_endpoint(self, service_url):
    """Test new endpoint"""
    response = requests.post(
        f"{service_url}/new_endpoint",
        json={"data": "test"},
        timeout=10
    )
    assert response.status_code == 200
```

## Test Fixtures

Available fixtures (defined in `conftest.py`):

- `mock_image` - PIL Image object for testing
- `mock_image_bytes` - Image bytes for testing
- `mock_moondream_model` - Mock Moondream model
- `mock_melotts_model` - Mock MeloTTS model
- `mock_audio_bytes` - Mock WAV audio bytes
- `sample_tts_payload` - Sample TTS payload
- `env_without_hf_token` - Environment without HF token
- `env_with_hf_token` - Environment with HF token

## Troubleshooting

### Tests Fail Due to Missing Models

Unit tests use mocks and don't require actual models. If integration tests fail:

1. Ensure models are installed or mocked
2. Check environment variables (HUGGINGFACE_TOKEN for Moondream3)
3. Verify service is running for integration tests

### Import Errors

Ensure you're running tests from the `bentoml` directory:

```bash
cd bentoml
pytest tests/ -v
```

### Timeout Errors

Increase timeout in `pytest.ini`:

```ini
--timeout=600  # 10 minutes
```

Or use pytest-timeout directly:

```bash
pytest tests/ --timeout=600
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Use mocks for external dependencies
3. **Coverage**: Aim for >80% code coverage
4. **Naming**: Use descriptive test names
5. **Documentation**: Document complex test scenarios
6. **Speed**: Keep unit tests fast (<1s each)
7. **CI/CD**: Run tests automatically on push/PR

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this README if needed

