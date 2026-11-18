FROM tsl0922/ttyd:latest

# Install terminal utilities and create a real, unprivileged login user.
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends tmux \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 10001 --create-home --shell /bin/bash terminal \
    && chown -R 10001:10001 /home/terminal

USER terminal
ENV HOME=/home/terminal
WORKDIR /home/terminal

EXPOSE 10000

# Render injects PORT. Require HTTP Basic Auth before starting the writable shell.
CMD ["sh", "-c", "test -n \"$TTYD_CREDENTIAL\" || { echo 'ERROR: Set TTYD_CREDENTIAL (username:password) in Render environment variables.' >&2; exit 1; }; exec ttyd -i 0.0.0.0 -p \"${PORT:-10000}\" -c \"$TTYD_CREDENTIAL\" -W bash"]
