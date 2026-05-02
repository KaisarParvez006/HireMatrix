#!/bin/bash

echo ""
echo "⬡  HireMatrix — Setup & Start"
echo "================================"
echo ""

# Install server deps
echo "📦 Installing server dependencies..."
cd server && npm install
if [ $? -ne 0 ]; then
  echo "❌ Server install failed. Make sure Node.js v16+ is installed."
  exit 1
fi
echo "✓ Server dependencies installed"
echo ""

# Install client deps
echo "📦 Installing client dependencies..."
cd ../client && npm install
if [ $? -ne 0 ]; then
  echo "❌ Client install failed."
  exit 1
fi
echo "✓ Client dependencies installed"
echo ""

cd ..

echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Now start in TWO separate terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd server && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd client && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "  Admin login: admin@hirematrix.com / admin123"
echo ""
echo "  📧 OTP codes print to server console (EMAIL_ENABLED=false by default)"
echo "================================"
