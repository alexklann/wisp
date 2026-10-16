"""add is_pinned

Revision ID: 1e532d1a8d0b
Revises: 36b8ceafe51c
Create Date: 2026-10-13 13:31:16.175986

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "1e532d1a8d0b"
down_revision: Union[str, Sequence[str], None] = "36b8ceafe51c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("messages", "is_pinned")
