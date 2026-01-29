# GitPulse Backend

개인용 Git 활동 대시보드 API 서버.

## 실행

```bash
uv sync
uv run uvicorn app.main:app --reload
```

## API

- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 추가
- `DELETE /api/projects/{id}` - 프로젝트 삭제
- `GET /api/projects/{id}/stats` - 프로젝트 통계
- `GET /api/config` - Git 설정 조회
