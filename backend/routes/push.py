import json
import os
from pathlib import Path
from uuid import uuid4

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlmodel import select, col
from starlette import status
from starlette.exceptions import HTTPException
from webpush import WebPush, WebPushSubscription

from database import get_session
from models import PushSubscription, ServerMember
from routes.auth import get_current_user_id
from functools import lru_cache

from core.connection_manager import get_connection_manager

load_dotenv()

router = APIRouter()

@lru_cache()
def get_webpush_client() -> WebPush:
    return WebPush(
        public_key=Path("./vapid_public.pem"),
        private_key=Path("./vapid_private.pem"),
        subscriber=os.getenv("VAPID_CLAIM_SUB", "admin@example.com"),
        ttl=86400,
    )


class SubscriptionKeys(BaseModel):
    auth: str
    p256dh: str


class PushSubscribeRequestBody(BaseModel):
    endpoint: str
    expirationTime: str | None
    keys: SubscriptionKeys


@router.post("/subscribe")
async def post_push_subscribe(
    requestBody: PushSubscribeRequestBody,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    new_subscription = PushSubscription(
        id=str(uuid4()),
        user_id=user_id,
        endpoint=requestBody.endpoint,
        p256dh=requestBody.keys.p256dh,
        auth=requestBody.keys.auth,
    )

    try:
        session.add(new_subscription)
        await session.commit()
        await session.refresh(new_subscription)

        return new_subscription
    except Exception as e:
        print(f"Error creating channel: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="internal server error",
        )


@router.delete("/unsubscribe")
async def post_push_unsubscribe(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
):
    pass

@router.get('/key')
async def get_public_vapid_key():
    return {"publicKey": os.getenv("VAPID_PUBLIC_KEY")}

@router.post("/test")
async def send_test_push(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id),
    wp: WebPush = Depends(get_webpush_client)
):
    result = await session.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subscriptions = result.scalars().all()
    if not subscriptions:
        raise HTTPException(status_code=404, detail="No subscriptions found")

    for sub in subscriptions:
        subscription = WebPushSubscription.model_validate(
            {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth,
                },
            }
        )

        try:
            message = wp.get(
                message=json.dumps(
                    {"title": "Test Title", "body": "Hello from backend!"}
                ),
                subscription=subscription,
            )
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    str(subscription.endpoint),
                    content=message.encrypted,
                    headers=message.headers,  # type: ignore
                )
        except Exception as e:
            print(f"Push failed for {sub.endpoint}: {e}")

    return {"status": "sent", "count": len(subscriptions)}


async def send_push_notification(server_id: str, title: str, body: str, session: AsyncSession, sender_id: str | None = None) -> bool:
    wp = get_webpush_client()
    manager = get_connection_manager()
    
    result = await session.execute(
        select(ServerMember).where(ServerMember.server_id == server_id)
    )
    member_ids = [m.user_id for m in result.scalars().all()]

    if not member_ids:
        return False

    offline_member_ids = [
        uid for uid in member_ids
        if uid != sender_id and not manager.is_user_online(uid)
    ]

    if not offline_member_ids:
        return True

    result = await session.execute(
        select(PushSubscription).where(col(PushSubscription.user_id).in_(offline_member_ids))
    )
    subscriptions = result.scalars().all()

    if not subscriptions:
        return False

    for sub in subscriptions:
        subscription = WebPushSubscription.model_validate(
            {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth,
                },
            }
        )

        try:
            message = wp.get(
                message=json.dumps(
                    {"title": title, "body": body}
                ),
                subscription=subscription
            )

            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    str(subscription.endpoint),
                    content=message.encrypted,
                    headers=message.headers,  # type: ignore
                )
                print(f"FCM Push response status: {resp.status_code}, body: {resp.text}")
        except Exception as e:
            print(f"Push failed for {sub.endpoint}: {e}")
            return False

    return True