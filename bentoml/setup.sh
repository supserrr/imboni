#!/bin/bash

# BentoML Service Setup Script
# This script sets up a virtual environment and installs all dependencies

set -e

echo "Setting up BentoML service..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Install MeloTTS from source
echo "Installing MeloTTS..."
pip install git+https://github.com/myshell-ai/MeloTTS.git

# Download unidic
echo "Downloading unidic for Japanese support..."
python -m unidic download

echo ""
echo "Setup complete!"
echo ""
echo "To activate the virtual environment in the future, run:"
echo "  source venv/bin/activate"
echo ""
echo "To start the service, run:"
echo "  bentoml serve service.py:svc"
echo ""

