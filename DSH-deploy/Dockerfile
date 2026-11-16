# DeepSeek Harness Web UI on Render
FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=10000 DSH_HOME=/data/dsh HOME=/data/home
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates git python3 make g++ iproute2 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g @deepseek-ai/dsh@0.2.2-rc.3 \
    && mkdir -p /data/dsh /data/home /data/workspace
WORKDIR /data/workspace
EXPOSE 10000
# DSH rejects wildcard binds, so use the container's concrete IP.
# Render terminates TLS. The startup URL printed in logs is a login credential.
CMD ["sh", "-ec", "test -n \"$RENDER_EXTERNAL_HOSTNAME\" || { echo \"RENDER_EXTERNAL_HOSTNAME is required\" >&2; exit 1; }; HOST_IP=$(hostname -i | awk '{print $1}'); exec dsh web --no-open --host \"$HOST_IP\" --port \"$PORT\" --public-url \"https://$RENDER_EXTERNAL_HOSTNAME/\" --trusted-host \"$RENDER_EXTERNAL_HOSTNAME\""]
