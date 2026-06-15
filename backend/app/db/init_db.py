from app.core.config import get_settings
from app.db.session import Base, engine
import app.models  # Ensure models are registered


def init_db() -> None:
    settings = get_settings()
    if not settings.auto_create_tables:
        return

    # Development-only escape hatch for quick local experiments. Production
    # and Docker setup should use Alembic migrations instead.
    Base.metadata.create_all(bind=engine)
