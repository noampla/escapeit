@echo off
echo Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Deploying to Firebase...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo Deploy failed!
    pause
    exit /b 1
)

echo.
echo Deploy complete!
pause
