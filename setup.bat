@echo off
echo.
echo ⬡  HireMatrix — Setup & Start
echo ================================
echo.

echo 📦 Installing server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Server install failed. Make sure Node.js v16+ is installed.
    pause
    exit /b 1
)
echo ✓ Server dependencies installed
echo.

echo 📦 Installing client dependencies...
cd ..\client
call npm install
if errorlevel 1 (
    echo ❌ Client install failed.
    pause
    exit /b 1
)
echo ✓ Client dependencies installed
echo.

cd ..

echo ================================
echo ✅ Setup complete!
echo.
echo Now start in TWO separate Command Prompt windows:
echo.
echo   Window 1 (Backend):
echo     cd server
echo     npm run dev
echo.
echo   Window 2 (Frontend):
echo     cd client
echo     npm run dev
echo.
echo   Then open: http://localhost:5173
echo.
echo   Admin login: admin@hirematrix.com / admin123
echo.
echo   OTP codes print to server console (EMAIL_ENABLED=false by default)
echo ================================
pause
