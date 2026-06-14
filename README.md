# Wisp
A full-stack open-source alternative to Discord with real-time messaging and file sharing.  
Built for speed and simplicity with **Vite+React** and **FastAPI**.  

> **Note:** This project is primarily hosted on [Codeberg](https://codeberg.org/klann/wisp).  
> If you're viewing this on GitHub, please open issues and PRs on Codeberg, as they won’t be addressed here.

> Keep in mind that wisp is under active development.  
> The current version of wisp is not production ready.

## Features
- **Real-Time Messaging:** Communication using WebSockets for near-instant chat updates.
- **File Uploading:** Upload files up to 1GB and share them with others.
- **Image, Video and Audio Preview:** Inline preview allows for instant viewing inside of Wisp.
- **Server/Channel Architecture:** Provides a familiar feel while keeping your connections organized.
- **User-Role Security:** Basic security allows only the admin to change server settings.

## Quick Start / Development
### Prerequisites
- [Bun](https://bun.sh/) (for frontend)
- [Python 3.12+](https://www.python.org/) (for backend)
- [UV](https://github.com/astral-sh/uv) (Python package manager, for backend)

```bash
git clone ssh://git@codeberg.org/klann/wisp.git
cd wisp

# Install and start the frontend
cd frontend
bun run install
bun run dev --port 3000

# Install and start the backend
cd backend
uv sync
unv run fastapi dev --port 3001
```

This project requires various .env files to work.  
In the frontend folder, create a .env file with the following:
```
VITE_BACKEND_URL="http://localhost:3001" # The public backend url
VITE_ALLOWED_HOSTS=127.0.0.1 # The public frontend url/base-domain
```

In the backend folder:
```
token_secret="" # A generated secret using openssl
backend_public_url="http://localhost:3001" # The public backend url
FRONTEND_CORS_ORIGINS="http://localhost:3000" # The public frontend url
```

## License
This project uses a `GPL-3.0` license.
For more information see `LICENSE`.
