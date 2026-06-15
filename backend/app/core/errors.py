from __future__ import annotations

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings


def error_response(
    status_code: int,
    code: str,
    message: str,
    details: object | None = None,
) -> JSONResponse:
    body: dict[str, object] = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if details is not None:
        body["error"]["details"] = details  # type: ignore[index]
    return JSONResponse(status_code=status_code, content=body)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    code = f"HTTP_{exc.status_code}"
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        code = "UNAUTHORIZED"
    elif exc.status_code == status.HTTP_403_FORBIDDEN:
        code = "FORBIDDEN"
    elif exc.status_code == status.HTTP_404_NOT_FOUND:
        code = "NOT_FOUND"
    elif exc.status_code == status.HTTP_409_CONFLICT:
        code = "CONFLICT"

    return error_response(
        status_code=exc.status_code,
        code=code,
        message=str(exc.detail),
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        details=exc.errors(),
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    settings = get_settings()
    return error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code="DATABASE_ERROR",
        message="Database operation failed",
        details=str(exc) if settings.debug_errors else None,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    settings = get_settings()
    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code="INTERNAL_SERVER_ERROR",
        message="Internal server error",
        details=str(exc) if settings.debug_errors else None,
    )
