from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.api import api_router
import time
import traceback
from collections import deque

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Initialize global state variables
app.state.maintenance_mode = False
app.state.system_logs = deque(maxlen=50)

# Custom logging and maintenance mode middleware
@app.middleware("http")
async def custom_middleware(request: Request, call_next):
    method = request.method
    path = request.url.path
    start_time = time.time()
    
    # Check maintenance mode (only for CRM endpoints, exclude super-admin, auth, public, and docs)
    is_crm_endpoint = (
        path.startswith("/api/v1") 
        and not path.startswith("/api/v1/super-admin") 
        and not path.startswith("/api/v1/auth") 
        and not path.startswith("/api/v1/public")
    )
    if getattr(request.app.state, "maintenance_mode", False) and is_crm_endpoint:
        return JSONResponse(
            status_code=503,
            content={"detail": "В системе проводятся технические работы. Доступ временно ограничен."}
        )

    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        status_code = response.status_code
        log_line = f"[{time.strftime('%H:%M:%S')}] {method} {path} - {status_code} ({process_time:.1f}ms)"
        request.app.state.system_logs.append(log_line)
        return response
    except Exception as e:
        process_time = (time.time() - start_time) * 1000
        log_line = f"[{time.strftime('%H:%M:%S')}] ERROR: {method} {path} - Failed ({process_time:.1f}ms): {str(e)}"
        request.app.state.system_logs.append(log_line)
        tb_lines = traceback.format_exc().split('\n')
        for line in tb_lines[-5:]:
            if line.strip():
                request.app.state.system_logs.append(f"  {line}")
        raise e

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_origin_regex=r"https?://.*\.bronly-hub\.uz|https?://bronly-hub\.uz",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root_endpoint():
    return {"message": "Welcome to Bronly API. Access the docs at /docs"}
