"""add message color

Revision ID: 70a8f811f322
Revises: 1e532d1a8d0b
Create Date: 2026-10-27 13:25:12.613913

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "70a8f811f322"
down_revision: Union[str, Sequence[str], None] = "1e532d1a8d0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "messages",
        sa.Column("color", sa.String(), nullable=True, server_default=None),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("messages", "color")
