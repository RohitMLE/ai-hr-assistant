from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CurrentUserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    name: str
    employee_code: str
    department: str

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: CurrentUserResponse

