#!/usr/bin/env bash
# scripts/fix-selinux-supabase.sh
# Run once after cloning, before `supabase start`, on SELinux-enforcing hosts.
set -euo pipefail

if command -v getenforce >/dev/null && [ "$(getenforce)" = "Enforcing" ]; then
  echo "SELinux enforcing detected — labeling supabase secrets mount..."
  mkdir -p supabase/.temp/start-secrets
  sudo semanage fcontext -a -t container_file_t "$(pwd)/supabase/.temp/start-secrets(/.*)?" 2>/dev/null || true
  sudo restorecon -Rv supabase/.temp/start-secrets/
  sudo semanage fcontext -a -t container_file_t "$(pwd)/supabase/snippets(/.*)?" 2>/dev/null || true
  sudo restorecon -Rv supabase/snippets/
else
  echo "SELinux not enforcing — nothing to do."
fi