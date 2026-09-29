# HTTP module notes

## The two objects

`http.createServer((request, response) => {})` gives you one object pair per request:

| object | class | stream type | job |
| --- | --- | --- | --- |
| `request` | `http.IncomingMessage` | Readable | data coming **in** from the client |
| `response` | `http.ServerResponse` | Writable | data going **out** to the client |

Because `request` is a ReadableStream and `response` is a WritableStream, you can `pipe()` one into the other.

## Creating vs starting

- `createServer(cb)` builds the server but does **not** accept connections.
- `server.listen(port, host, cb)` starts it. The callback fires once it is ready.
- Omitting the host binds to all interfaces (`0.0.0.0`) — fine for a real server, surprising on a laptop.

## Reading the request

`request` is a stream, so the body arrives in chunks over time:

1. `"data"` — one chunk (a **Buffer**, not a string) per event.
2. `"end"` — the client finished; only now is the body complete.
3. `"error"` — the connection broke; handle it or the process can crash.

```js
let body = [];
request
  .on("data", (chunk) => body.push(chunk))
  .on("end", () => {
    body = Buffer.concat(body).toString();
  });
```

- `Buffer.concat(chunks)` — merges all chunks into a single Buffer.
- `.toString()` — decodes bytes to text.
- `request.url` is only the **path** (`/echo?x=1`), never a full URL.
- `request.headers` holds everything the client sent, lowercased.

## Writing the response

Order matters: set the status code and headers **before** sending the body.

```js
response.statusCode = 200;
response.setHeader("Content-Type", "application/json");
response.end(JSON.stringify(payload));
```

Or the combined form:

```js
response.writeHead(200, { "Content-Type": "application/json" });
response.end(JSON.stringify(payload));
```

- `response.write(chunk)` — send one piece; can be called repeatedly (streaming).
- `response.end()` — flush and close. Everything after it is ignored.
- `response.end(chunk)` — send the last piece and close in one call.
- The status code defaults to `200`, so it only needs to be set for errors.

## pipe vs manual read

`request.pipe(response)` is the shortest possible echo: no `data`, no `end`, no `Buffer.concat`.

Use `pipe` when forwarding the body untouched. Use the manual `data`/`end` version whenever you need to inspect, validate, or transform the body first.

## Routing

The callback is the router:

```js
if (request.method === "POST" && request.url === "/echo") {
  // handle
} else {
  response.statusCode = 404;
  response.end();
}
```

Read the body **after** the route check so unknown routes are rejected before doing any work.

## Status codes worth knowing

| code | meaning |
| --- | --- |
| 200 | OK — request succeeded |
| 201 | Created — resource was created |
| 204 | No Content — success, empty body |
| 400 | Bad Request — malformed input |
| 404 | Not Found — no route matched |
| 500 | Internal Server Error — your code threw |

## Who is responsible for what

An HTTP request passes through five layers. Knowing which layer owns a problem saves a lot of guessing.

| layer | what it owns | what it does NOT do |
| --- | --- | --- |
| your handler | routing, validation, business logic, status choice | parse HTTP, move bytes |
| `node:http` | the HTTP protocol: request line, headers, status codes, `Content-Length`, chunked encoding, keep-alive | know what your endpoint means |
| `node:net` | TCP connections, one object per socket | know about HTTP |
| libuv event loop | readiness polling — `epoll` (Linux), `kqueue` (macOS), `IOCP` (Windows) | run your business logic |
| OS kernel | the TCP/IP stack, packets, routing, `getaddrinfo` | know what HTTP is |

So when something breaks:

- `Cannot set headers after they are sent` → you called `write`/`end` twice, or forgot to return after sending.
- Body arrives garbled → you concatenated the wrong chunks, not a TCP problem.
- The server hangs under load but the code looks fine → something is blocking the main thread (see the thread pool notes in folder 1).
- A raw `ECONNRESET` with no HTTP status → the client vanished or the OS refused the connection. `node:http` never got far enough to reply.

### The important part: network I/O never uses the thread pool

Sockets are not blocking operations, so they are not offloaded to the libuv thread pool. The OS reports when a connection is readable or writable, and the event loop runs the callback.

Verified on this machine — 20 concurrent requests, each deliberately slow (300 ms):

| run | total |
| --- | --- |
| `UV_THREADPOOL_SIZE` unset (4) | 690 ms |
| `UV_THREADPOOL_SIZE=1` | 430 ms |

Both are nowhere near 20 x 300 ms = 6000 ms, and shrinking the pool to a single thread changed nothing. The work overlapped because the 300 ms was spent waiting, not computing. That is the whole idea behind the event loop, and it is what lets one thread serve thousands of connections.

Demo 3 in `../1- Introduction-to-nodejs/thread-pool.js` reproduces this.

## Handy: port 0

Use port `0` in tests and scripts, and read the real port back afterwards. The OS picks a free one, so the code can never collide with a server that is already running.

```js
server.listen(0, "127.0.0.1", () => {
  const { port } = server.address();
  console.log(`running on ${port}`);
});
```

## Quick test commands

```bash
curl http://127.0.0.1:8080/
curl -X POST http://127.0.0.1:8082/echo -d "hello"
curl -i http://127.0.0.1:8081/          # -i shows status + headers
```

`curl -i` is the best way to check the status code and headers, which browsers hide.
