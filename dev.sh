#!/bin/bash
# JCMS Development Start Script
echo "🏗️  Starting JCMS - Jagya Construction Management System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Start Laravel in background
echo "▶ Starting Laravel server on http://0.0.0.0:8000"
php artisan serve --host=0.0.0.0 --port=8000 &
LARAVEL_PID=$!

# Start Vite in background
echo "▶ Starting Vite HMR on http://0.0.0.0:5173"
npm run dev &
VITE_PID=$!

echo ""
echo "✅ JCMS is running!"
echo "   Local Host:  http://localhost:8000"
echo "   Phone URL:   http://10.91.225.192:8000"
echo "   Login:       admin@jagya.com / password"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "kill $LARAVEL_PID $VITE_PID; echo 'Servers stopped.'" INT
wait
