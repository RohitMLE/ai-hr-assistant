from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text

from app.api.v1 import router as v1_router
from app.core.config import get_settings
from app.core.errors import (
    error_response,
    http_exception_handler,
    sqlalchemy_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.db.init_db import init_db
from app.db.session import SessionLocal

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)

@app.on_event("startup")
def on_startup() -> None:
    init_db()

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

@app.get("/readiness")
def readiness() -> dict:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except SQLAlchemyError as exc:
        return error_response(
            status_code=503,
            code="READINESS_CHECK_FAILED",
            message="Database is not ready",
            details=str(exc) if settings.debug_errors else None,
        )
    finally:
        db.close()
