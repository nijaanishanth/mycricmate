from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from config import settings
from database import engine, Base
from routers import auth, users, players, teams

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="MyCricMate API - Cricket ecosystem platform",
    version="1.0.0"
)

# Add custom exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"========== VALIDATION ERROR ==========")
    print(f"Request URL: {request.url}")
    print(f"Request method: {request.method}")
    print(f"Validation errors: {exc.errors()}")
    print(f"Request body: {await request.body()}")
    print(f"======================================")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(players.router)
app.include_router(teams.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to MyCricMate API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
