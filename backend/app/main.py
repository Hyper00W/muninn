from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.document import router as documents_router

app = FastAPI(
    title="MUNINN",
    version="0.1.0"
)

app.include_router(health_router)
app.include_router(documents_router)