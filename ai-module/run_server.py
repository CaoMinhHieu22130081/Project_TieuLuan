from __future__ import annotations

if __name__ == '__main__':
    import uvicorn
    from app import app
    # run without auto-reload so we can start the server from this runner
    import os

    port = int(os.getenv('AI_MODULE_PORT', '8000'))
    uvicorn.run(app, host='127.0.0.1', port=port, reload=False)
