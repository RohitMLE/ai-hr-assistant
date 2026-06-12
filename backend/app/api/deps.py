from __future__ import annotations

from typing import Optional, Sequence

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.org import Permission, Role
from app.models.user import User


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or unknown user",
        )
    return user


def require_hr_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "hr_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR admin role required",
        )
    return current_user


def require_manager_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in {"manager", "hr_admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or HR admin role required",
        )
    return current_user


def check_permission(required_permission: str):
    def permission_dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "hr_admin":  # Super override
            return current_user

        if not current_user.role_rel:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: No role assigned",
            )

        permissions = {p.name for p in current_user.role_rel.permissions}
        if required_permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: Missing '{required_permission}'",
            )
        return current_user

    return permission_dependency


def require_roles_with_permission(allowed_roles: Sequence[str], required_permission: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in set(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Role is not allowed for this action",
            )

        if current_user.role == "hr_admin":  # Super override for the current MVP role model
            return current_user

        if not current_user.role_rel:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied: No role assigned",
            )

        permissions = {p.name for p in current_user.role_rel.permissions}
        if required_permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: Missing '{required_permission}'",
            )
        return current_user

    return dependency
