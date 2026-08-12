import os
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db, close_db, is_mock_mode, get_connection_error
from services import get_db_service, init_services
from routes import food, users, recommendations, graph
from models import SeedResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    init_db()
    init_services()
    yield
    # Shutdown logic
    close_db()

app = FastAPI(
    title="Andhra Culinary Knowledge Graph API",
    description="Backend API powered by FastAPI and CognoDB/Neo4j Graph Database.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend routing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Database-Mode"]
)

# Custom header middleware to indicate if running in Mock Mode
@app.middleware("http")
async def add_db_mode_header(request, call_next):
    response = await call_next(request)
    mode = "Mock" if is_mock_mode() else "CognoDB-Live"
    response.headers["X-Database-Mode"] = mode
    return response

# Register routers
app.include_router(food.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(graph.router, prefix="/api")

@app.get("/api/health")
def health_check():
    mock_mode = is_mock_mode()
    connection_error = get_connection_error()
    
    status = "healthy"
    message = "Service is up and running"
    
    if mock_mode:
        status = "degraded"
        message = "Connected in Demo/Mock Mode. CognoDB Cloud is offline or unconfigured."
        
    return {
        "status": status,
        "message": message,
        "database": {
            "mode": "Mock (In-Memory)" if mock_mode else "CognoDB / Neo4j (Bolt Connection)",
            "connected": not mock_mode,
            "error": connection_error
        }
    }

@app.post("/api/seed", response_model=SeedResponse)
def seed_database(service=Depends(get_db_service)):
    try:
        result = service.seed_data()
        return SeedResponse(
            status=result["status"],
            message=result["message"],
            nodes_created=result["nodes_created"],
            relationships_created=result["relationships_created"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to seed database: {str(e)}"
        )

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
