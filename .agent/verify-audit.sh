#!/bin/bash

# Client Dashboard Audit - Implementation Helper Script
# This script provides commands to verify and fix identified issues

set -e

echo "============================================"
echo "Client Dashboard Audit - Helper Scripts"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check Node version
check_node_version() {
    log_info "Checking Node.js version..."
    local node_version=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$node_version" -ge 20 ]; then
        log_info "✓ Node.js $node_version (>=20) - OK"
    else
        log_error "✗ Node.js $node_version (<20) - MUST UPGRADE"
        exit 1
    fi
}

# Check if packages are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    cd /home/mohamed/Documents/Apps/hassad-platform/apps/api
    
    if [ -d "node_modules/@nestjs/throttler" ]; then
        log_info "✓ @nestjs/throttler is installed"
    else
        log_warn "✗ @nestjs/throttler NOT installed - Run: npm install @nestjs/throttler"
    fi
    
    if [ -d "node_modules/bcrypt" ]; then
        log_info "✓ bcrypt is installed"
    else
        log_error "✗ bcrypt NOT installed"
    fi
}

# Check for rate limiting configuration
check_rate_limiting() {
    log_info "Checking rate limiting configuration..."
    
    local app_module="/home/mohamed/Documents/Apps/hassad-platform/apps/api/src/app.module.ts"
    
    if grep -q "ThrottlerModule" "$app_module"; then
        log_info "✓ ThrottlerModule found in app.module.ts"
    else
        log_error "✗ ThrottlerModule NOT found in app.module.ts"
        log_info "  → Add ThrottlerModule to imports array"
    fi
}

# Check for file upload limits
check_file_limits() {
    log_info "Checking file upload limits..."
    
    local portal_module="/home/mohamed/Documents/Apps/hassad-platform/apps/api/src/modules/portal/portal.module.ts"
    
    if grep -q "limits:" "$portal_module"; then
        log_info "✓ File size limits configured"
    else
        log_error "✗ File size limits NOT configured"
        log_info "  → Add limits config to MulterModule"
    fi
}

# Check for page size validation
check_page_limits() {
    log_info "Checking page size validation..."
    
    local portal_controller="/home/mohamed/Documents/Apps/hassad-platform/apps/api/src/modules/portal/controllers/portal.controller.ts"
    
    if grep -q "parseLimit" "$portal_controller"; then
        log_info "✓ parseLimit() function found"
    else
        log_error "✗ parseLimit() function NOT found"
        log_info "  → Add parseLimit() helper and update all endpoints"
    fi
}

# Check for permission caching
check_permissions_cache() {
    log_info "Checking JWT permission caching..."
    
    local auth_service="/home/mohamed/Documents/Apps/hassad-platform/apps/api/src/auth/auth.service.ts"
    
    if grep -q "permissions," "$auth_service"; then
        log_info "✓ Permissions cached in JWT payload"
    else
        log_error "✗ Permissions NOT cached in JWT payload"
        log_info "  → Add permissions array to JWT payload"
    fi
}

# Check for WebSocket invalidations
check_websocket_invalidation() {
    log_info "Checking WebSocket invalidations..."
    
    local portal_service="/home/mohamed/Documents/Apps/hassad-platform/apps/api/src/modules/portal/services/portal.service.ts"
    
    if grep -q "broadcastInvalidations" "$portal_service"; then
        log_info "✓ WebSocket invalidation methods found"
    else
        log_error "✗ WebSocket invalidation methods NOT found"
        log_info "  → Add broadcastInvalidations() to mutations"
    fi
}

# Check for polling intervals
check_polling_intervals() {
    log_info "Checking polling intervals..."
    
    local portal_dir="/home/mohamed/Documents/Apps/hassad-platform/apps/web/app/(portal)"
    
    local count_30=$(find "$portal_dir" -name "*.tsx" -type f -exec grep -l "pollingInterval: 30_000" {} \; | wc -l)
    local count_120=$(find "$portal_dir" -name "*.tsx" -type f -exec grep -l "pollingInterval: 120_000" {} \; | wc -l)
    
    log_info "  → 30s polling: $count_30 pages"
    log_info "  → 120s polling: $count_120 pages"
    
    if [ "$count_30" -gt 0 ]; then
        log_warn "✗ $count_30 pages still using 30s polling (should be 120s)"
    else
        log_info "✓ All pages using 120s polling"
    fi
}

# Check for error handling
check_error_handling() {
    log_info "Checking error handling..."
    
    local files=(
        "/home/mohamed/Documents/Apps/hassad-platform/apps/web/app/(portal)/portal/page.tsx"
        "/home/mohamed/Documents/Apps/hassad-platform/apps/web/app/(portal)/portal/chat/page.tsx"
        "/home/mohamed/Documents/Apps/hassad-platform/apps/web/app/(portal)/portal/notifications/page.tsx"
    )
    
    local has_toast=0
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            if grep -q "toast.error" "$file"; then
                has_toast=$((has_toast + 1))
            fi
        fi
    done
    
    log_info "  → Files with toast.error: $has_toast / 3"
    
    if [ "$has_toast" -lt 3 ]; then
        log_warn "✗ Error handling not fully implemented"
    else
        log_info "✓ All files have error handling"
    fi
}

# Check for RTK retry logic
check_rtk_retry() {
    log_info "Checking RTK retry logic..."
    
    local base_query="/home/mohamed/Documents/Apps/hassad-platform/apps/web/lib/baseQuery.ts"
    
    if grep -q "maxRetries" "$base_query"; then
        log_info "✓ RTK retry logic found"
    else
        log_error "✗ RTK retry logic NOT found"
        log_info "  → Add retry loop to baseQuery"
    fi
}

# Main function
main() {
    echo "Running Client Dashboard Audit Verification..."
    echo ""
    
    check_node_version
    echo ""
    
    check_dependencies
    echo ""
    
    check_rate_limiting
    echo ""
    
    check_file_limits
    echo ""
    
    check_page_limits
    echo ""
    
    check_permissions_cache
    echo ""
    
    check_websocket_invalidation
    echo ""
    
    check_polling_intervals
    echo ""
    
    check_error_handling
    echo ""
    
    check_rtk_retry
    echo ""
    
    echo "============================================"
    echo "Verification Complete"
    echo "============================================"
    echo ""
    echo "To see detailed implementation steps, read:"
    echo "  - /home/mohamed/Documents/Apps/hassad-platform/.agent/IMPLEMENTATION_STEPS.md"
    echo "  - /home/mohamed/Documents/Apps/hassad-platform/.agent/CLIENT_DASHBOARD_FIX_PLAN.md"
}

# Run main function
main "$@"
