# DeepSeek Harness Web UI on Render: loopback DSH + authenticated reverse proxy
FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=10000 DSH_HOME=/data/dsh HOME=/data/home
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git python3 make g++ iproute2 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @deepseek-ai/dsh@0.2.2-rc.3 \
    && mkdir -p /data/dsh /data/home /data/workspace
COPY DSH-deploy/proxy.cjs /opt/dsh-proxy.cjs
WORKDIR /data/workspace
EXPOSE 10000
# DSH intentionally disallows wildcard binding. Only the authenticated proxy is public.
# Render should use Dockerfile Path DSH-deploy/Dockerfile and root build context.
CMD ["sh", "-ec", "test -n \"$RENDER_EXTERNAL_HOSTNAME\" || { echo 'RENDER_EXTERNAL_HOSTNAME is required' >&2; exit 1; }; test -n \"$DSH_PROXY_PASSWORD\" || { echo 'DSH_PROXY_PASSWORD is required' >&2; exit 1; }; node /opt/dsh-proxy.cjs & exec dsh web --no-open --host 127.0.0.1 --port 3080 --public-url \"https://$RENDER_EXTERNAL_HOSTNAME/\" --trusted-host \"$RENDER_EXTERNAL_HOSTNAME\""]
