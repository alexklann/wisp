from datetime import datetime, timedelta, timezone

import jwt

from core.config import settings


def verify_jwt(token: str):
    try:
        payload = jwt.decode(token, settings.token_secret, algorithms=["HS256"])
        jwt_uuid = payload.get("user_id")
        jwt_name = payload.get("user_name")
        jwt_exp = payload.get("exp")

        if not jwt_uuid or not jwt_name or not jwt_exp:
            return None

        return {"user_id": jwt_uuid, "user_name": jwt_name}
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError:
        print("Token is invalid")
        return None


def encode_jwt(user_id: str, user_name: str) -> str:
    return jwt.encode(
        {
            "user_id": user_id,
            "user_name": user_name,
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
        },
        settings.token_secret,
        algorithm="HS256",
    )
