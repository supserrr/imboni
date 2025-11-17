#!/bin/bash
# Start MeloTTS HTTP API Server

echo "Starting MeloTTS HTTP API Server..."
echo "Make sure MeloTTS is installed and dependencies are satisfied."

# Check if MeloTTS is installed
if ! python -c "import melo" 2>/dev/null; then
    echo "Error: MeloTTS is not installed."
    echo "Please install it first:"
    echo "  git clone https://github.com/myshell-ai/MeloTTS.git"
    echo "  cd MeloTTS"
    echo "  pip install -e ."
    echo "  python -m unidic download"
    exit 1
fi

# Check if Flask is installed
if ! python -c "import flask" 2>/dev/null; then
    echo "Installing Flask dependencies..."
    pip install -r requirements.txt
fi

# Start the server
python server.py

