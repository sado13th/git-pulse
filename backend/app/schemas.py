"""Pydantic 스키마 정의."""

from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    """프로젝트 생성 요청."""

    name: str = Field(..., min_length=1, max_length=100, description="프로젝트 이름")
    path: str = Field(..., min_length=1, max_length=500, description="Git 저장소 경로")
    description: str | None = Field(None, max_length=500, description="프로젝트 설명")


class ProjectResponse(BaseModel):
    """프로젝트 응답."""

    id: int
    name: str
    path: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyStats(BaseModel):
    """일별 통계."""

    date: str
    commits: int
    additions: int
    deletions: int


class ProjectStats(BaseModel):
    """프로젝트 통계 응답."""

    project_id: int
    period_days: int
    total_commits: int
    additions: int
    deletions: int
    daily_stats: list[DailyStats]


class ConfigResponse(BaseModel):
    """설정 응답."""

    git_user_name: str | None


class ErrorResponse(BaseModel):
    """에러 응답."""

    detail: str
