@echo off
setlocal
cd /d "%~dp0"
echo Add the OpenAI project API key. The value will not be displayed.
call npx.cmd wrangler secret put OPENAI_API_KEY
if errorlevel 1 goto :failed
echo.
echo Add a long random salt used to hash daily visitor identifiers.
call npx.cmd wrangler secret put RATE_LIMIT_SALT
if errorlevel 1 goto :failed
echo.
echo Both secrets were uploaded.
pause
exit /b 0

:failed
echo.
echo Secret setup did not complete. Leave this window open and copy the error.
pause
exit /b 1

