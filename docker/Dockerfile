FROM python:3.12-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN uv sync --no-dev --frozen

# Copy source code
COPY src/ ./src/

# Run the application
CMD ["uv", "run", "python", "-m", "git_pulse.main"]
