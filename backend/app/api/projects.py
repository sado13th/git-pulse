"""프로젝트 API 라우터."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project
from ..schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectStats,
    ConfigResponse,
    DailyStats,
)
from ..git_analyzer import (
    get_git_user_name,
    validate_git_repository,
    analyze_repository,
)

router = APIRouter(prefix="/api", tags=["projects"])


@router.get("/config", response_model=ConfigResponse)
def get_config():
    """Git 설정 조회."""
    return ConfigResponse(git_user_name=get_git_user_name())


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    """프로젝트 목록 조회."""
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return projects


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """프로젝트 추가."""
    # Git 저장소 유효성 검사
    if not validate_git_repository(project.path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효한 Git 저장소가 아닙니다.",
        )

    # 중복 경로 검사
    existing = db.query(Project).filter(Project.path == project.path).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 등록된 저장소 경로입니다.",
        )

    db_project = Project(
        name=project.name,
        path=project.path,
        description=project.description,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    return db_project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """프로젝트 삭제."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    db.delete(project)
    db.commit()


@router.get("/projects/{project_id}/stats", response_model=ProjectStats)
def get_project_stats(project_id: int, db: Session = Depends(get_db)):
    """프로젝트 통계 조회."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다.",
        )

    # Git 저장소 분석
    if not validate_git_repository(project.path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Git 저장소에 접근할 수 없습니다.",
        )

    stats = analyze_repository(project.path, days=7)

    return ProjectStats(
        project_id=project_id,
        period_days=stats["period_days"],
        total_commits=stats["total_commits"],
        additions=stats["additions"],
        deletions=stats["deletions"],
        daily_stats=[DailyStats(**d) for d in stats["daily_stats"]],
    )
