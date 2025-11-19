@echo off
REM BentoML Service Setup Script for Windows
REM This script sets up a virtual environment and installs all dependencies

echo Setting up BentoML service...

REM Check Python version
python --version

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Install MeloTTS from source
echo Installing MeloTTS...
pip install git+https://github.com/myshell-ai/MeloTTS.git

REM Download unidic
echo Downloading unidic for Japanese support...
python -m unidic download

echo.
echo Setup complete!
echo.
echo To activate the virtual environment in the future, run:
echo   venv\Scripts\activate.bat
echo.
echo To start the service, run:
echo   bentoml serve service.py:svc
echo.

pause

