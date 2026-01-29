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


def analyze_repository(
    path: str, days: int = 7, filter_user: str | None = None
) -> dict:
    """
    Git 저장소 분석.

    Args:
        path: Git 저장소 경로
        days: 분석할 기간 (일)
        filter_user: 필터링할 사용자 이름 (None이면 전체)

    Returns:
        분석 결과 딕셔너리
    """
    repo = Repo(path)

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

    # 기여자별 통계
    contributors_stats: dict[str, dict] = {}

    # 커밋 순회
    try:
        for commit in repo.iter_commits():
            commit_date = datetime.fromtimestamp(commit.committed_date)

            # 기간 필터
            if commit_date < since_date:
                break

            author_name = commit.author.name

            # 사용자 필터 (filter_user가 지정된 경우에만 필터링)
            if filter_user and author_name != filter_user:
                continue

            date_str = commit_date.strftime("%Y-%m-%d")
            if date_str not in daily_stats:
                continue

            # 기여자 통계 초기화
            if author_name not in contributors_stats:
                contributors_stats[author_name] = {
                    "commits": 0,
                    "additions": 0,
                    "deletions": 0,
                }

            # 커밋 통계
            daily_stats[date_str]["commits"] += 1
            contributors_stats[author_name]["commits"] += 1
            total_commits += 1

            # 코드 변경량 (첫 번째 커밋이 아닌 경우)
            if commit.parents:
                try:
                    diff = commit.parents[0].diff(commit)
                    for d in diff:
                        additions = 0
                        deletions = 0

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
                                else:
                                    deletions = a_lines - b_lines
                            except (UnicodeDecodeError, ValueError):
                                pass
                        elif d.new_file and d.b_blob:
                            try:
                                additions = len(
                                    d.b_blob.data_stream.read().decode().splitlines()
                                )
                            except (UnicodeDecodeError, ValueError):
                                pass
                        elif d.deleted_file and d.a_blob:
                            try:
                                deletions = len(
                                    d.a_blob.data_stream.read().decode().splitlines()
                                )
                            except (UnicodeDecodeError, ValueError):
                                pass

                        daily_stats[date_str]["additions"] += additions
                        daily_stats[date_str]["deletions"] += deletions
                        contributors_stats[author_name]["additions"] += additions
                        contributors_stats[author_name]["deletions"] += deletions
                        total_additions += additions
                        total_deletions += deletions

                except Exception:
                    pass

    except Exception:
        pass

    # 일별 통계를 리스트로 변환 (날짜 오름차순)
    daily_list = [
        {"date": date, **stats} for date, stats in sorted(daily_stats.items())
    ]

    # 기여자 통계를 리스트로 변환 (커밋 수 내림차순)
    contributors_list = []
    for name, stats in sorted(
        contributors_stats.items(), key=lambda x: x[1]["commits"], reverse=True
    ):
        percentage = (stats["commits"] / total_commits * 100) if total_commits > 0 else 0
        contributors_list.append(
            {
                "name": name,
                "commits": stats["commits"],
                "additions": stats["additions"],
                "deletions": stats["deletions"],
                "percentage": round(percentage, 1),
            }
        )

    return {
        "period_days": days,
        "total_commits": total_commits,
        "additions": total_additions,
        "deletions": total_deletions,
        "daily_stats": daily_list,
        "contributors": contributors_list,
    }
