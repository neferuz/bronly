"""add schedule to business

Revision ID: 845124c47402
Revises: 674c61eda3b6
Create Date: 2026-06-16 05:19:53.753692

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '845124c47402'
down_revision: Union[str, Sequence[str], None] = '674c61eda3b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('businesses', sa.Column('schedule', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('businesses', 'schedule')
