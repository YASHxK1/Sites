FROM tsl0922/ttyd:latest

# Run the terminal service without root privileges.
RUN mkdir -p /home/terminal && chown -R 10001:10001 /home/terminal
USER 10001:10001
WORKDIR /home/terminal

EXPOSE 10000

# Render injects PORT. Require credentials before starting the writable shell.
CMD ["sh", "-c", "test -n \"$TTYD_CREDENTIAL\" || { echo 'ERROR: Set TTYD_CREDENTIAL (username:password) in Render environment variables.' >&2; exit 1; }; exec ttyd -i 0.0.0.0 -p \"${PORT:-10000}\" -c \"$TTYD_CREDENTIAL\" -W bash"]
