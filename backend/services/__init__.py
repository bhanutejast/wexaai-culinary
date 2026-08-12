from database import is_mock_mode
from services.neo4j_service import Neo4jService
from services.mock_service import MockService

_neo4j_service = None
_mock_service = None

def get_db_service():
    global _neo4j_service, _mock_service
    if is_mock_mode():
        if _mock_service is None:
            _mock_service = MockService()
        return _mock_service
    else:
        if _neo4j_service is None:
            _neo4j_service = Neo4jService()
        return _neo4j_service
      
# Pre-initialize services
def init_services():
    get_db_service()
