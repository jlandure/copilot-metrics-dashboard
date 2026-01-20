#!/bin/sh
set -e

# Substitute $PORT with the actual port value from environment
sed -i "s/\$PORT/${PORT:-8080}/g" /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;"
