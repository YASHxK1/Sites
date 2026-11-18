# ttyd on Render

Deploy [ttyd](https://github.com/tsl0922/ttyd), a browser-based terminal, as a Docker Web Service on Render.

> **Security:** This service exposes an interactive shell. Keep authentication enabled, use a strong unique password, and do not share the URL or credentials publicly.

## Deploy to Render

1. Push this directory to the `main` branch of `YASHxK1/Sites`.
2. In Render, choose **New → Blueprint** and connect the `YASHxK1/Sites` repository.
3. Render detects `ttyd/render.yaml`. Review the service configuration and create the service.
4. When prompted for `TTYD_CREDENTIAL`, enter a username and strong password in this format:

   ```text
   admin:replace-with-a-long-random-password
   ```

5. Deploy. Open the generated `onrender.com` URL and authenticate.

You can also create a **Web Service** manually:
- **Runtime:** Docker
- **Dockerfile path:** `./ttyd/Dockerfile`
- **Docker context:** repository root
- **Environment variable:** `TTYD_CREDENTIAL` = `username:strong-password`

Render supplies the `PORT` environment variable. The container binds ttyd to `0.0.0.0` on that port.

## Configuration

- `TTYD_CREDENTIAL`: required HTTP Basic Authentication credentials in `username:password` format.
- `PORT`: supplied by Render; defaults to `10000` for local Docker runs.
- `-W`: enables a writable terminal so commands can be entered.

## Important limitations

- The terminal runs inside the Render container, **not on your personal computer**.
- The container's local filesystem is ephemeral. Files created in the terminal may be lost when the service is redeployed or its instance is replaced. Do not use it as persistent storage.
- A writable terminal provides shell access to the container. Treat its URL and password as sensitive, and do not expose secrets in the container environment unnecessarily.

## Run locally

From the repository root:

```bash
docker build -f ttyd/Dockerfile -t sites-ttyd .
docker run --rm -p 10000:10000 \
  -e TTYD_CREDENTIAL='admin:change-this-password' \
  -e PORT=10000 \
  sites-ttyd
```

Then open `http://localhost:10000`.
