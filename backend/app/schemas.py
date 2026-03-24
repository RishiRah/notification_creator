from datetime import datetime

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    title: str = Field(..., max_length=256)
    body: str = ""
    source: str = ""
    priority: str = Field("normal", pattern="^(low|normal|high|critical)$")
    tags: list[str] = []


class NotificationOut(BaseModel):
    id: int
    title: str
    body: str
    source: str
    priority: str
    read: bool
    created_at: datetime
    tags: list[str]

    model_config = {"from_attributes": True}


class NotificationListOut(BaseModel):
    items: list[NotificationOut]
    total: int
    page: int
    per_page: int


class MarkReadRequest(BaseModel):
    ids: list[int]


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    is_admin: bool
    is_approved: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    user: UserOut
