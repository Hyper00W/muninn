from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.document import router as documents_router
from app.api.routes.search import router as search_router
from app.api.routes.chat import router as chat_router

app = FastAPI(
    title="MUNINN",
    description="AI Due Diligence Copilot",
    version="0.1.0"
)

app.include_router(health_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(chat_router)