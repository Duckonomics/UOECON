@echo off
setlocal
cd /d "%~dp0"
echo Deploying the interactive paper to Cloudflare...
echo.
call npx.cmd wrangler deploy
echo.
if errorlevel 1 (
  echo Deployment did not complete. Leave this window open and copy the error.
) else (
  echo Deployment completed successfully. Copy the workers.dev URL shown above.
)
pause

