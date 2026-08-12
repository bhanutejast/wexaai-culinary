import sys
import logging
from database import init_db, is_mock_mode, close_db
from services import get_db_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("seed")

def main():
    logger.info("Initializing database connection for seeding...")
    
    # Initialize connection
    # If the database is unconfigured/unavailable and mock fallback is enabled, 
    # it returns True but is_mock_mode() is True.
    try:
        init_db()
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        logger.error("Please configure valid CognoDB credentials in your .env file.")
        sys.exit(1)
        
    mock_active = is_mock_mode()
    if mock_active:
        logger.warning("=" * 60)
        logger.warning("⚠️  WARNING: Running in In-Memory MOCK MODE.")
        logger.warning("Seeding will update the local runtime state of the mock service.")
        logger.warning("To seed a live database, please set COGNODB_MOCK_FALLBACK=false")
        logger.warning("and configure valid COGNODB_URI, USERNAME, and PASSWORD in .env.")
        logger.warning("=" * 60)
        
    try:
        service = get_db_service()
        logger.info("Running seed process...")
        res = service.seed_data()
        
        logger.info("=" * 60)
        logger.info("🎉 Seeding Completed successfully!")
        logger.info(f"Status: {res['status']}")
        logger.info(f"Message: {res['message']}")
        logger.info(f"Nodes Created: {res['nodes_created']}")
        logger.info(f"Relationships Created: {res['relationships_created']}")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"❌ Seeding failed with error: {e}")
        close_db()
        sys.exit(1)
        
    close_db()

if __name__ == "__main__":
    main()
