from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import client
from seed import seed
from routers import users, assets, maintenance, inventory, notifications, core, reports, stock

app = FastAPI(title="Sistem Monitoring BMN dan Barang Persediaan")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Sistem Monitoring BMN dan Barang Persediaan - API aktif"}


# Register routers
api_router.include_router(users.router, tags=["users"])
api_router.include_router(assets.router, tags=["assets"])
api_router.include_router(assets.image_router, tags=["images"])
api_router.include_router(maintenance.router, tags=["maintenance"])
api_router.include_router(inventory.router, tags=["inventory"])
api_router.include_router(notifications.router, tags=["notifications"])
api_router.include_router(core.router, tags=["core"])
api_router.include_router(reports.router, tags=["reports"])
api_router.include_router(stock.router, tags=["stock"])

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    try:
        await seed()
        logger.info("Seed selesai.")
    except Exception as e:
        logger.error(f"Seed error: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
