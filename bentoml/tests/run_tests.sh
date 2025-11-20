#!/bin/bash
# Test runner script for Imboni BentoML Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}=== Imboni BentoML Service Test Suite ===${NC}\n"

# Check if virtual environment exists
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo -e "${YELLOW}Virtual environment not found. Creating...${NC}"
    cd "$PROJECT_DIR"
    python3 -m venv venv
fi

# Activate virtual environment
source "$PROJECT_DIR/venv/bin/activate"

# Install test dependencies
echo -e "${GREEN}Installing test dependencies...${NC}"
pip install -q -r "$SCRIPT_DIR/requirements.txt"
pip install -q pytest pytest-cov pytest-mock pytest-timeout requests pillow numpy

# Parse command line arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-true}"

cd "$PROJECT_DIR"

case "$TEST_TYPE" in
    unit)
        echo -e "${GREEN}Running unit tests...${NC}"
        if [ "$COVERAGE" = "true" ]; then
            pytest tests/test_service_unit.py -v --cov=service --cov-report=term-missing
        else
            pytest tests/test_service_unit.py -v
        fi
        ;;
    integration)
        echo -e "${GREEN}Running integration tests...${NC}"
        echo -e "${YELLOW}Note: This requires the BentoML service to be running${NC}"
        pytest tests/test_service_integration.py -v -m integration
        ;;
    schema)
        echo -e "${GREEN}Running database schema tests...${NC}"
        pytest tests/test_database_schema.py -v
        ;;
    all)
        echo -e "${GREEN}Running all tests...${NC}"
        if [ "$COVERAGE" = "true" ]; then
            pytest tests/ -v --cov=service --cov-report=term-missing --cov-report=html
            echo -e "\n${GREEN}Coverage report generated in htmlcov/index.html${NC}"
        else
            pytest tests/ -v
        fi
        ;;
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [unit|integration|schema|all] [coverage=true|false]"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi

