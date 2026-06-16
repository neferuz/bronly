"""add_slug_to_business

Revision ID: a6b72a9a4556
Revises: 0e5df3630c6f
Create Date: 2026-06-16 18:44:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6b72a9a4556'
down_revision: Union[str, Sequence[str], None] = '0e5df3630c6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('businesses', sa.Column('slug', sa.String(), nullable=True))
    op.create_index(op.f('ix_businesses_slug'), 'businesses', ['slug'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_businesses_slug'), table_name='businesses')
    op.drop_column('businesses', 'slug')
