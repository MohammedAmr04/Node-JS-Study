Node.js is an open-source and cross-platform JavaScript runtime environment. It is a popular tool for almost any kind of project!

Node.js runs the V8 JavaScript engine, the core of Google Chrome, outside of the browser. This allows Node.js to be very performant.

This allows Node.js to handle thousands of concurrent connections with a single server without introducing the burden of managing thread concurrency, which could be a significant source of bugs.

Node.js has a unique advantage because millions of frontend developers that write JavaScript for the browser are now able to write the server-side code in addition to the client-side code without the need to learn a completely different language


JavaScript is internally compiled by V8 with just-in-time (JIT) compilation to speed up the execution.

Note: REPL stands for Read Evaluate Print Loop, and it is a programming language environment (basically a console window) that takes single expression as user input and returns the result back to the console after execution. The REPL session provides a convenient way to quickly test simple JavaScript code.

## The event loop

All your JavaScript runs on a single thread, the main thread. That single thread is the event loop: it runs a task, then checks whether anything is ready to run next, and repeats.

Concurrency does not come from threads. It comes from never waiting. A server that sits on a slow database does not sleep — it registers a callback and moves on to the next connection. The OS signals "this socket has data", the event loop wakes up, and only then does JavaScript run.

## The thread pool

Some work cannot be done on the main thread without freezing everything, because it is a blocking operating-system call. Reading a file, resolving a hostname, or hashing a password are C++ calls that cannot be interrupted safely halfway through.

libuv keeps a small pool of worker threads for exactly those calls. The default size is **4**.

| Goes to the thread pool | Stays on the event loop |
| --- | --- |
| `fs` async calls (`readFile`, `open`, `read`, `stat`) | network sockets and `http` |
| `dns.lookup` | `dns.resolve` (uses c-ares) |
| `crypto.pbkdf2`, `scrypt`, `randomBytes` | timers, `process.nextTick` |
| `zlib` compress / decompress | `worker_threads` (separate threads) |

```bash
UV_THREADPOOL_SIZE=8 node app.js
```

This must be set before Node starts. It is a poor man's fix: raising it hides the real problem, which is usually that you are doing blocking work per request. Increasing it does not make your JavaScript parallel, it only lets more blocking C++ calls run at once.

### The sync trap

The async version hands the work to a pool thread and returns immediately. The sync version does the work right now, on the main thread, and nothing else can run until it finishes.

```js
setTimeout(() => console.log("timer"), 0);

crypto.pbkdf2Sync("pw", "salt", 300000, 32, "sha256"); // timer waits for this
```

Run `node thread-pool.js` in this folder to reproduce everything below. The numbers here were measured on this machine (Node v20, 8-core laptop) and will shift on yours, especially by 20-30% between runs — the demo reports the best of 3 for that reason.

A `setTimeout(0)` should fire on the very next turn of the event loop. When it does not, the main thread was busy:

| call | when the timer actually fired |
| --- | --- |
| 4 x `crypto.pbkdf2` (async) | after 6 ms — event loop stayed free |
| 1 x `crypto.pbkdf2Sync` | after 291 ms — event loop was blocked |

A single synchronous call froze the process for longer than four asynchronous ones took to finish.

And the pool size really is the limit, with 4 concurrent hash jobs:

| `UV_THREADPOOL_SIZE` | total time |
| --- | --- |
| 1 | 502 ms |
| 2 | 331 ms |
| 4 | 299 ms |

Size 1 queues all four jobs behind each other. Past the number of jobs you actually have, extra threads buy nothing.

### When to use what

- **I/O that blocks the OS** (`fs`, `dns.lookup`, `crypto`) — use the async or `fs.promises` version and let the pool handle it.
- **CPU-bound JavaScript** (hashing in JS, image processing, parsing a huge file) — the pool will not help, because the work is in JavaScript and JS is single-threaded. Use `worker_threads`, one per CPU core.
- **Anything on a hot path** — never use the `Sync` variants in a server, not even for small files.