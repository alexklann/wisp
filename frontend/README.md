# Wisp - Frontend

## Quick Start / Development
### Prerequisites
- [Bun](https://bun.sh/)

```bash
bun run install
bun run dev --port 3000
```

This project requires various .env files to work.
In this folder, create a .env file with the following:
```
VITE_BACKEND_URL="http://localhost:3001" # The public backend url
VITE_ALLOWED_HOSTS=127.0.0.1 # The public frontend url/base-domain
```
