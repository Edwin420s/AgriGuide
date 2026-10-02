from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import domain  # noqa: F401
from app.api.routes import router

from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Idempotent migration for crop_catalog multilingual columns in SQLite
with engine.connect() as conn:
    for col_name, col_type in [("name_en", "VARCHAR(100)"), ("name_sw", "VARCHAR(100)"), ("aliases", "JSON")]:
        try:
            conn.execute(text(f"ALTER TABLE crop_catalog ADD COLUMN {col_name} {col_type}"))
            conn.commit()
        except Exception:
            pass

try:
    from app.db.session import SessionLocal
    from app.models.domain import Farm
    _db = SessionLocal()
    if _db.query(Farm).count() == 0:
        from scripts.seed_demo import seed
        seed(recreate_tables=False)
    _db.close()
except Exception:
    pass

app = FastAPI(title=settings.app_name, version="1.0.0", description="Adaptive neural-symbolic agricultural decision intelligence")
# Collect all allowed origins
cors_origins_list = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
for default_origin in [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]:
    if default_origin not in cors_origins_list:
        cors_origins_list.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix=settings.api_prefix)
app.include_router(router)  # Also mount without prefix to support frontend configurations targeting domain root

@app.get("/")
def root():
    return {"name":"AgriGuide","version":"1.0.0","status":"running"}
