from uuid import uuid4

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.exceptions import HTTPException

from database import get_session
from models import Channel, Server, ServerMember, ServerWithMembership
from routes.auth import get_current_user_id

router = APIRouter()


class CreateServerRequestBody(BaseModel):
    name: str


@router.post("/")
async def post_server(
    requestBody: CreateServerRequestBody,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    server_id = str(uuid4())

    server = Server(id=str(server_id), name=requestBody.name, owner_id=user_id)
    session.add(server)
    await session.commit()
    await session.refresh(server)

    return server


@router.get("/")
async def get_servers(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(Server, ServerMember)
        .join(ServerMember, col(Server.id) == ServerMember.server_id)
        .where(ServerMember.user_id == user_id)
    )

    result = await session.exec(statement)

    servers = []
    for server, membership in result:
        if membership.joined_at is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ServerWithMembership doesn't have joined_at",
            )

        servers.append(
            ServerWithMembership(
                id=server.id,
                name=server.name,
                icon_url=server.icon_url,
                role=membership.role,
                joined_at=membership.joined_at,
            )
        )

    return servers


@router.get("/{server_id}")
async def get_server(
    server_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = select(ServerMember).where(ServerMember.user_id == user_id)
    result = await session.exec(statement)
    server_member = result.first()

    if server_member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not member of this server",
        )

    statement = select(Server).where(Server.id == server_id)
    result = await session.exec(statement)
    server = result.first()

    if server is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server does not exist",
        )

    return server


@router.get("/{server_id}/join")
async def get_join_server(
    server_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = select(Server).where(Server.id == server_id)
    result = await session.exec(statement)
    server = result.first()

    if server is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Server does not exist",
        )

    new_member = ServerMember(server_id=server_id, user_id=user_id, role="member")

    try:
        session.add(new_member)
        await session.commit()

        await session.refresh(new_member)
        return new_member
    except IntegrityError as e:
        await session.rollback()

        if "UNIQUE" in str(e.orig):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="already a member"
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="invalid server or user ID"
        )


class CreateChannelRequestBody(BaseModel):
    name: str


@router.post("/{server_id}/channels")
async def post_channels(
    server_id: str,
    requestBody: CreateChannelRequestBody,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(ServerMember)
        .where(ServerMember.user_id == user_id)
        .where(ServerMember.server_id == server_id)
    )
    result = await session.exec(statement)
    server_member = result.first()

    if server_member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not member of this server",
        )

    if server_member.role == "member":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not the owner of this server",
        )

    channel_id = str(uuid4())

    new_channel = Channel(id=channel_id, name=requestBody.name, server_id=server_id)

    try:
        session.add(new_channel)
        await session.commit()

        await session.refresh(new_channel)

        return new_channel

    except Exception as e:
        print(f"Error creating channel: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="internal server error",
        )


@router.get("/{server_id}/channels")
async def get_channels(
    server_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(ServerMember)
        .where(ServerMember.user_id == user_id)
        .where(ServerMember.server_id == server_id)
    )
    result = await session.exec(statement)
    server_member = result.first()

    if server_member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not member of this server",
        )

    statement = select(Channel).where(Channel.server_id == server_id)
    result = await session.exec(statement)
    channels = result.all()

    return channels


@router.get("/{server_id}/members")
async def get_server_members(
    server_id: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    statement = (
        select(ServerMember)
        .where(ServerMember.user_id == user_id)
        .where(ServerMember.server_id == server_id)
    )
    result = await session.exec(statement)
    server_member = result.first()

    if server_member is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You're not member of this server",
        )

    statement = select(ServerMember).where(ServerMember.server_id == server_id)
    result = await session.exec(statement)
    server_members = result.all()

    return server_members
