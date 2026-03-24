import os
from pathlib import Path

DATABASE_DIR = Path(__file__).resolve().parent.parent / "data"
DATABASE_DIR.mkdir(exist_ok=True)
DATABASE_URL = f"sqlite+aiosqlite:///{DATABASE_DIR / 'notifications.db'}"

CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production!!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 72
