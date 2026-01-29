"""Pydantic 스키마 정의."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class FilterMode(str, Enum):
    """필터 모드."""

    ME = "me"
    ALL = "all"


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


class Contributor(BaseModel):
    """기여자 통계."""

    name: str
    commits: int
    additions: int
    deletions: int
    percentage: float


class ProjectStats(BaseModel):
    """프로젝트 통계 응답."""

    project_id: int
    period_days: int
    filter_mode: FilterMode
    total_commits: int
    additions: int
    deletions: int
    daily_stats: list[DailyStats]
    contributors: list[Contributor]


class ConfigResponse(BaseModel):
    """설정 응답."""

    git_user_name: str | None


class ErrorResponse(BaseModel):
    """에러 응답."""

    detail: str
