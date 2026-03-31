from datetime import datetime
from typing import Optional
from uuid import uuid4

import bcrypt
from fastapi import APIRouter, Depends, status
from fastapi.exceptions import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from core.jwt import encode_jwt, verify_jwt
from database import get_session
from models import User

router = APIRouter()

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    payload = verify_jwt(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload["user_id"]


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(pwd_bytes, salt)
    return password_hash.decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    password_bytes = password.encode("utf-8")
    hash_bytes = password_hash.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hash_bytes)


class RegisterRequestBody(BaseModel):
    username: str
    display_name: str
    password: str


class RegisterResponseBody(BaseModel):
    id: str
    username: str
    display_name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    token: str


@router.post("/register")
async def post_register(
    requestBody: RegisterRequestBody, session: AsyncSession = Depends(get_session)
):
    user_id = uuid4()
    password_hash = hash_password(requestBody.password)

    user = User(
        id=str(user_id),
        username=requestBody.username,
        display_name=requestBody.display_name,
        password_hash=password_hash,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    token = encode_jwt(user.id, user.username)

    return_data = user.model_dump()
    return_data["token"] = token

    return RegisterResponseBody.model_validate(return_data)


class LoginRequestBody(BaseModel):
    username: str
    password: str


class LoginResponseBody(BaseModel):
    id: str
    username: str
    display_name: str
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    token: str


@router.post("/login")
async def post_login(
    requestBody: LoginRequestBody, session: AsyncSession = Depends(get_session)
):
    statement = select(User).where(User.username == requestBody.username)
    result = await session.exec(statement)
    user = result.first()

    if user is None or not verify_password(requestBody.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User doesn't exist or password is wrong",
        )

    token = encode_jwt(user.id, user.username)

    return_data = user.model_dump()
    return_data["token"] = token

    return LoginResponseBody.model_validate(return_data)
