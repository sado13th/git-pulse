"""GitPulse Backend - FastAPI 앱."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .api.projects import router as projects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행."""
    # 시작: DB 초기화
    init_db()
    yield
    # 종료: 정리 작업


app = FastAPI(
    title="GitPulse API",
    description="개인용 Git 활동 대시보드 API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(projects_router)


@app.get("/")
def root():
    """헬스 체크."""
    return {"status": "ok", "service": "GitPulse API"}
