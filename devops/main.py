# -*- coding: utf-8 -*-
from fastapi import FastAPI
from app import config
from app.routers import api_router

app = FastAPI(title=config.ENVIRONMENT)


@app.get("/")
async def root():
    return {"message": f"Hello World {config.ENVIRONMENT_FROM_SECRET}!"}

app.include_router(api_router)
