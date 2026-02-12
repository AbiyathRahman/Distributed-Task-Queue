#!/bin/bash
# Docker helper script for Distributed Task Queue

set -e

case "${1:-help}" in
  build)
    echo "🔨 Building Docker images..."
    docker-compose build
    echo "✅ Build complete!"
    ;;

  start)
    echo "🚀 Starting services..."
    docker-compose up -d
    echo "✅ Services started!"
    echo "📊 Backend: http://localhost:3000"
    echo "🔌 WebSocket: ws://localhost:8080"
    echo "🗄️  MongoDB: localhost:27017"
    echo "💾 Redis: localhost:6379"
    ;;

  stop)
    echo "⏹️  Stopping services..."
    docker-compose down
    echo "✅ Services stopped!"
    ;;

  restart)
    echo "🔄 Restarting services..."
    docker-compose down
    docker-compose up -d
    echo "✅ Services restarted!"
    ;;

  logs)
    service="${2:-}"
    if [ -n "$service" ]; then
      docker-compose logs -f "$service"
    else
      docker-compose logs -f
    fi
    ;;

  status)
    echo "📋 Service Status:"
    docker-compose ps
    ;;

  clean)
    echo "🧹 Cleaning up..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;

  shell)
    service="${2:-backend-server}"
    echo "🔓 Connecting to $service..."
    docker-compose exec "$service" sh
    ;;

  health)
    echo "🏥 Checking health..."
    curl -s http://localhost:3000/health | jq .
    ;;

  scale)
    count="${2:-3}"
    echo "📈 Scaling workers to $count..."
    # Note: Docker Compose doesn't auto-scale this way in version 3.8
    # Manual editing of docker-compose.yml required
    echo "⚠️  Manual scaling: Edit docker-compose.yml and add/remove worker services"
    ;;

  reset)
    echo "🔄 Full reset (removes all data)..."
    docker-compose down -v
    docker-compose up -d
    echo "✅ System reset started!"
    ;;

  *)
    echo "Distributed Task Queue - Docker Helper"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  build                 Build Docker images"
    echo "  start                 Start all services"
    echo "  stop                  Stop all services"
    echo "  restart               Restart all services"
    echo "  logs [service]        View logs (all or specific service)"
    echo "  status                Show running services"
    echo "  shell [service]       Open shell in container"
    echo "  health                Check backend health"
    echo "  clean                 Remove containers and images"
    echo "  reset                 Full reset (WARNING: deletes data)"
    echo "  scale [count]         Scale workers (manual editing required)"
    echo ""
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 logs backend-worker-1"
    echo "  $0 shell mongodb"
    echo "  $0 health"
    ;;
esac
