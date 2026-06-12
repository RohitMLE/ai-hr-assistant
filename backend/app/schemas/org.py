from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class DepartmentBase(BaseModel):
    name: str
    code: str
    manager_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True


class DesignationBase(BaseModel):
    title: str
    level: Optional[int] = None


class DesignationCreate(DesignationBase):
    pass


class DesignationResponse(DesignationBase):
    id: int

    class Config:
        from_attributes = True


class OrgHierarchyResponse(BaseModel):
    departments: List[DepartmentResponse]
    designations: List[DesignationResponse]
