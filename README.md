# git-pulse

A Python project.

## Requirements

- Python 3.12+
- [mise](https://mise.jdx.dev/) (recommended for version management)

## Setup

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Install dependencies
mise install\nuv sync
```

## Development

```bash
uv run python -m git_pulse.main
```

## Testing

```bash
uv run pytest
```

## Project Structure

```
git-pulse/
├── src/
│   └── git_pulse/
│       ├── __init__.py
│       └── main.py
├── tests/
├── pyproject.toml
├── README.md
└── CLAUDE.md
```

## License

This project is licensed under the NO LICENSE License.
