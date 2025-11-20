@echo off
REM Test runner script for Imboni BentoML Service (Windows)

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

echo === Imboni BentoML Service Test Suite ===
echo.

REM Check if virtual environment exists
if not exist "%PROJECT_DIR%\venv" (
    echo Virtual environment not found. Creating...
    cd /d "%PROJECT_DIR%"
    python -m venv venv
)

REM Activate virtual environment
call "%PROJECT_DIR%\venv\Scripts\activate.bat"

REM Install test dependencies
echo Installing test dependencies...
pip install -q -r "%SCRIPT_DIR%requirements.txt"
pip install -q pytest pytest-cov pytest-mock pytest-timeout requests pillow numpy

REM Parse command line arguments
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

set COVERAGE=%2
if "%COVERAGE%"=="" set COVERAGE=true

cd /d "%PROJECT_DIR%"

if "%TEST_TYPE%"=="unit" (
    echo Running unit tests...
    if "%COVERAGE%"=="true" (
        pytest tests\test_service_unit.py -v --cov=service --cov-report=term-missing
    ) else (
        pytest tests\test_service_unit.py -v
    )
) else if "%TEST_TYPE%"=="integration" (
    echo Running integration tests...
    echo Note: This requires the BentoML service to be running
    pytest tests\test_service_integration.py -v -m integration
) else if "%TEST_TYPE%"=="schema" (
    echo Running database schema tests...
    pytest tests\test_database_schema.py -v
) else if "%TEST_TYPE%"=="all" (
    echo Running all tests...
    if "%COVERAGE%"=="true" (
        pytest tests\ -v --cov=service --cov-report=term-missing --cov-report=html
        echo.
        echo Coverage report generated in htmlcov\index.html
    ) else (
        pytest tests\ -v
    )
) else (
    echo Unknown test type: %TEST_TYPE%
    echo Usage: %0 [unit^|integration^|schema^|all] [coverage=true^|false]
    exit /b 1
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo All tests passed!
    exit /b 0
) else (
    echo.
    echo Some tests failed
    exit /b 1
)

