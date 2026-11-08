# Wisp - Backend

## Quick Start / Development

### Prerequisites

- [Python 3.12+](https://www.python.org/)
- [UV](https://github.com/astral-sh/uv) (Python package manager)

```bash
uv sync
uv run fastapi dev --port 3001
```

This project requires various .env files to work.
In this folder, create a .env file with the following:

```
token_secret="" # A generated secret using openssl
```
