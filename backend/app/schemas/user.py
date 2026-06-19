from pydantic import BaseModel
from app.core.permissions import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    
    first_name: str
    last_name: str
    email: str
    role: UserRole
    is_active: bool


class UserCreate(UserBase):
    """Schema for creating a user (includes password)."""
    
    password_hash: str


class UserResponse(UserBase):
    """Schema for user response (excludes password)."""
    
    id: str
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user information schema."""
    
    id: str
    first_name: str
    last_name: str
    email: str
    role: UserRole
    is_active: bool
    
    class Config:
        from_attributes = True
