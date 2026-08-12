import os
import logging
from neo4j import GraphDatabase
from neo4j.exceptions import AuthError, ServiceUnavailable
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

load_dotenv()

COGNODB_URI = os.getenv("COGNODB_URI", "bolt://localhost:7687")
COGNODB_USERNAME = os.getenv("COGNODB_USERNAME", "neo4j")
COGNODB_PASSWORD = os.getenv("COGNODB_PASSWORD", "password")
COGNODB_MOCK_FALLBACK = os.getenv("COGNODB_MOCK_FALLBACK", "true").lower() in ("true", "1", "yes")

_driver = None
_use_mock = False
_connection_error = None

def init_db():
    global _driver, _use_mock, _connection_error
    
    # Check if credentials are placeholders
    if not COGNODB_URI or COGNODB_URI == "bolt://localhost:7687" and not COGNODB_MOCK_FALLBACK:
         logger.warning("Running with default local credentials. Database might be unavailable.")
         
    try:
        logger.info(f"Connecting to CognoDB Cloud at {COGNODB_URI}...")
        _driver = GraphDatabase.driver(
            COGNODB_URI, 
            auth=(COGNODB_USERNAME, COGNODB_PASSWORD)
        )
        # Verify connection
        with _driver.session() as session:
            result = session.run("RETURN 1 AS val")
            record = result.single()
            if record and record["val"] == 1:
                logger.info("✅ Successfully connected to CognoDB / Neo4j Graph Database!")
                _use_mock = False
                _connection_error = None
                return True
    except (AuthError, ServiceUnavailable, Exception) as e:
        _connection_error = str(e)
        logger.error(f"❌ Failed to connect to CognoDB Cloud: {e}")
        
        if COGNODB_MOCK_FALLBACK:
            logger.warning("⚠️ COGNODB_MOCK_FALLBACK is enabled. Falling back to in-memory graph representation.")
            _use_mock = True
        else:
            logger.error("❌ Fallback disabled. Backend will fail to start or reject requests.")
            _use_mock = False
            raise e

    return not _use_mock

def get_driver():
    global _driver
    if _use_mock:
        return None
    if _driver is None:
        init_db()
    return _driver

def is_mock_mode():
    return _use_mock

def get_connection_error():
    return _connection_error

def close_db():
    global _driver
    if _driver:
        logger.info("Closing database driver connection...")
        _driver.close()
        _driver = None
