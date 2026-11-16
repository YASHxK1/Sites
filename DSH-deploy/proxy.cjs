// Public-facing authenticated reverse proxy for the loopback-only DSH UI.
"use strict";
const http = require("node:http");
const net = require("node:net");
const crypto = require("node:crypto");

const port = Number(process.env.PORT || 10000);
const password = process.env.DSH_PROXY_PASSWORD;
const username = process.env.DSH_PROXY_USERNAME || "admin";
const upstreamPort = 3080;

if (!password || password.length < 16) {
  console.error("Set DSH_PROXY_PASSWORD in Render Environment (at least 16 characters).");
  process.exit(1);
}
const expected = Buffer.from(username + ":" + password);
function authorized(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Basic ")) return false;
  let supplied;
  try { supplied = Buffer.from(value.slice(6), "base64"); }
  catch { return false; }
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}
function deny(socketOrResponse, isUpgrade = false) {
  if (isUpgrade) {
    socketOrResponse.end('HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Basic realm="DSH"\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
  } else {
    socketOrResponse.writeHead(401, { "WWW-Authenticate": 'Basic realm="DSH"', "Cache-Control": "no-store" });
    socketOrResponse.end("Authentication required");
  }
}
const server = http.createServer((req, res) => {
  if (!authorized(req)) return deny(res);
  const headers = { ...req.headers };
  delete headers.authorization;
  const upstream = http.request({ hostname: "127.0.0.1", port: upstreamPort, path: req.url, method: req.method, headers }, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.on("error", err => {
    console.error("DSH upstream:", err.message);
    if (!res.headersSent) res.writeHead(502);
    res.end("DSH is not ready");
  });
  req.pipe(upstream);
});
server.on("upgrade", (req, socket, head) => {
  if (!authorized(req)) return deny(socket, true);
  const headers = { ...req.headers };
  delete headers.authorization;
  const upstream = net.connect(upstreamPort, "127.0.0.1");
  upstream.on("connect", () => {
    const lines = [req.method + " " + req.url + " HTTP/1.1"];
    for (const [key, value] of Object.entries(headers)) {
      if (Array.isArray(value)) value.forEach(v => lines.push(key + ": " + v));
      else if (value !== undefined) lines.push(key + ": " + value);
    }
    upstream.write(lines.join("\r\n") + "\r\n\r\n");
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});
server.listen(port, "0.0.0.0", () => console.log("Authenticated DSH proxy listening on 0.0.0.0:" + port));
