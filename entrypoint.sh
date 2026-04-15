#!/bin/sh
set -e

# When Railway (or any container runtime) mounts a volume at /data, the mount
# overlay replaces the directory created during the image build -- ownership
# may not match the 'node' user the app runs as.  Fix it here while we still
# have root, then drop privileges before starting the server.
mkdir -p /data
chown -R node:node /data

exec su-exec node "$@"
