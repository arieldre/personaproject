#!/bin/bash

# =====================================================
# PERSONA PLATFORM - QUICK SETUP SCRIPT
# =====================================================

echo "🎭 Persona Platform Setup"
echo "========================="
echo ""

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        return 1
    fi
    echo "✅ $1 found"
    return 0
}

echo "Checking requirements..."
check_command node || exit 1
check_command npm || exit 1

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (found v$NODE_VERSION)"
    exit 1
fi
echo "✅ Node.js version OK"
echo ""

# Check for .env files
echo "Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo "   ⚠️  Please edit backend/.env with your credentials"
else
    echo "⏭️  backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "⏭️  frontend/.env already exists"
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env (for Docker)"
else
    echo "⏭️  .env already exists"
fi
echo ""

# Install dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies installed"
echo ""

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✅ Frontend dependencies installed"
echo ""

# Summary
echo "========================="
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment:"
echo "   - Edit backend/.env with your database and API keys"
echo "   - Get a free Groq API key at https://console.groq.com"
echo "   - (Optional) Set up Google/Microsoft OAuth"
echo ""
echo "2. Set up the database:"
echo "   Option A: Use Docker:"
echo "   docker run -d --name persona-db -e POSTGRES_USER=persona -e POSTGRES_PASSWORD=persona_secret -e POSTGRES_DB=persona_platform -p 5432:5432 postgres:16-alpine"
echo ""
echo "   Option B: Use Neon/Supabase free tier"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npm run migrate && npm run seed"
echo ""
echo "4. Start the development servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "5. Open http://localhost:5173 in your browser"
echo ""
echo "Default login: admin@personaplatform.com / changeme123"
echo ""
