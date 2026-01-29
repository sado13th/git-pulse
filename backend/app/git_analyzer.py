"""Git 저장소 분석 모듈."""

import subprocess
from datetime import datetime, timedelta
from pathlib import Path

from git import Repo
from git.exc import InvalidGitRepositoryError


def get_git_user_name() -> str | None:
    """글로벌 git config에서 user.name 가져오기."""
    try:
        result = subprocess.run(
            ["git", "config", "--global", "user.name"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip() or None
    except subprocess.CalledProcessError:
        return None


def validate_git_repository(path: str) -> bool:
    """유효한 Git 저장소인지 확인."""
    try:
        repo_path = Path(path)
        if not repo_path.exists():
            return False
        Repo(repo_path)
        return True
    except InvalidGitRepositoryError:
        return False


def analyze_repository(path: str, days: int = 7) -> dict:
    """
    Git 저장소 분석.

    Args:
        path: Git 저장소 경로
        days: 분석할 기간 (일)

    Returns:
        분석 결과 딕셔너리
    """
    repo = Repo(path)
    user_name = get_git_user_name()

    # 기간 설정
    since_date = datetime.now() - timedelta(days=days)

    # 일별 통계 초기화
    daily_stats: dict[str, dict] = {}
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[date] = {"commits": 0, "additions": 0, "deletions": 0}

    total_commits = 0
    total_additions = 0
    total_deletions = 0

    # 커밋 순회
    try:
        for commit in repo.iter_commits():
            commit_date = datetime.fromtimestamp(commit.committed_date)

            # 기간 필터
            if commit_date < since_date:
                break

            # 사용자 필터 (user_name이 없으면 모든 커밋 포함)
            if user_name and commit.author.name != user_name:
                continue

            date_str = commit_date.strftime("%Y-%m-%d")
            if date_str not in daily_stats:
                continue

            # 커밋 통계
            daily_stats[date_str]["commits"] += 1
            total_commits += 1

            # 코드 변경량 (첫 번째 커밋이 아닌 경우)
            if commit.parents:
                try:
                    diff = commit.parents[0].diff(commit)
                    for d in diff:
                        if d.a_blob and d.b_blob:
                            try:
                                a_lines = (
                                    len(d.a_blob.data_stream.read().decode().splitlines())
                                    if d.a_blob
                                    else 0
                                )
                                b_lines = (
                                    len(d.b_blob.data_stream.read().decode().splitlines())
                                    if d.b_blob
                                    else 0
                                )
                                if b_lines > a_lines:
                                    additions = b_lines - a_lines
                                    daily_stats[date_str]["additions"] += additions
                                    total_additions += additions
                                else:
                                    deletions = a_lines - b_lines
                                    daily_stats[date_str]["deletions"] += deletions
                                    total_deletions += deletions
                            except (UnicodeDecodeError, ValueError):
                                # 바이너리 파일 무시
                                pass
                        elif d.new_file and d.b_blob:
                            try:
                                lines = len(
                                    d.b_blob.data_stream.read().decode().splitlines()
                                )
                                daily_stats[date_str]["additions"] += lines
                                total_additions += lines
                            except (UnicodeDecodeError, ValueError):
                                pass
                        elif d.deleted_file and d.a_blob:
                            try:
                                lines = len(
                                    d.a_blob.data_stream.read().decode().splitlines()
                                )
                                daily_stats[date_str]["deletions"] += lines
                                total_deletions += lines
                            except (UnicodeDecodeError, ValueError):
                                pass
                except Exception:
                    # diff 계산 실패 시 무시
                    pass

    except Exception:
        # 커밋이 없는 경우
        pass

    # 일별 통계를 리스트로 변환 (날짜 오름차순)
    daily_list = [
        {"date": date, **stats}
        for date, stats in sorted(daily_stats.items())
    ]

    return {
        "period_days": days,
        "total_commits": total_commits,
        "additions": total_additions,
        "deletions": total_deletions,
        "daily_stats": daily_list,
    }
