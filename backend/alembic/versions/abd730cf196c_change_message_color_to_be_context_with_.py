"""change message color to be context with int

Revision ID: abd730cf196c
Revises: 70a8f811f322
Create Date: 2026-10-30 21:02:13.211929

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "abd730cf196c"
down_revision: Union[str, Sequence[str], None] = "70a8f811f322"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "messages",
        sa.Column("context", sa.Integer(), nullable=True, server_default=None),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("messages", "color")
