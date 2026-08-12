import sys
import os

# Add the 'backend' directory to the Python path
# This ensures imports inside backend (e.g. database, services, models) resolve correctly.
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
sys.path.append(backend_dir)

# Import the FastAPI app
from main import app
