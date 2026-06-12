from pathlib import Path

from alembic import command
from alembic.config import Config

from app.db.session import engine, Base
import app.models  # Ensure models are registered

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    alembic_cfg = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    command.stamp(alembic_cfg, "head")
