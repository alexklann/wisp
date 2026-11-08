import os
from pathlib import Path
from functools import lru_cache
from webpush import WebPush
from webpush.vapid import VAPID
from core.config import settings

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

KEY_DIR = Path(os.getenv("VAPID_KEY_DIR", "."))
PRIVATE_PEM = KEY_DIR / "vapid_private.pem"
PUBLIC_PEM = KEY_DIR / "vapid_public.pem"


@lru_cache
def get_webpush_client() -> WebPush:
    return WebPush(
        private_key=PRIVATE_PEM,
        public_key=PUBLIC_PEM,
        subscriber=settings.vapid_claim_sub,
        ttl=600,
    )


def get_public_key_b64() -> str:
    return VAPID.get_application_server_key(
        serialization.load_pem_public_key(PUBLIC_PEM.read_bytes())
    )


def ensure_vapid_keys():
    have_private = PRIVATE_PEM.exists()
    have_public = PUBLIC_PEM.exists()

    if have_private and have_public:
        return

    if have_private != have_public:
        raise RuntimeError(f"half-provisioned VAPID key pair!")

    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    KEY_DIR.mkdir(parents=True, exist_ok=True)

    PRIVATE_PEM.write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    PRIVATE_PEM.chmod(0o600)

    PUBLIC_PEM.write_bytes(
        public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )

    print(f"Generated VAPID keypair at {PRIVATE_PEM} and {PUBLIC_PEM}")
