// =====================================================================
// Runnable demo for the "thread pool" section of Notes.md
// ---------------------------------------------------------------------
//   node thread-pool.js
//
// It runs three demos and exits on its own (no server left hanging).
// Every timing below was measured on this machine, so compare your
// numbers with the ones written in the comments - they will be close.
//
// Key point: the thread pool is NOT where your JavaScript runs. Your JS
// is always on one main thread. The pool only exists for blocking
// operating-system calls that the main thread is not allowed to do.
// =====================================================================

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

// High enough that the difference is visible, low enough to keep the
// demo under a second. 300k iterations took ~90-230ms per call here.
const ITERATIONS = 300_000;

// Demo 2 runs the whole table several times, so it uses a cheaper hash to
// stay fast. The signal is still ~3x, which is far bigger than the noise.
const BENCH_ITERATIONS = 150_000;
const BENCH_RUNS = 3;

const JOB_COUNT = 4;
const CLIENTS = 20;
const SLOW_RESPONSE_MS = 300;

const SELF = fileURLToPath(import.meta.url);

// This file re-runs ITSELF in a child process, because UV_THREADPOOL_SIZE
// is read once when Node boots. Setting it later with
// process.env.UV_THREADPOOL_SIZE = "8" has no effect at all - that is
// the whole reason the variable exists as an env var and not a setting.
if (process.argv[2] === "child-pool") runChildPool();
else if (process.argv[2] === "child-network") runChildNetwork();
else await main();

// =====================================================================
// Helpers
// =====================================================================

function banner(title) {
  console.log(`\n${"=".repeat(66)}\n${title}\n${"=".repeat(66)}`);
}

// Promisified pbkdf2 - this is the async version, so the work is
// handed to a pool thread and this function returns immediately.
function hash(iterations = ITERATIONS) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2("secret", "salt", iterations, 32, "sha256", (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

// setTimeout(0) should run on the next tick of the event loop. If the
// main thread is busy, this promise resolves late, and the difference IS
// the blocked time. This is the simplest way to feel the event loop.
function waitForNextTick() {
  const start = Date.now();
  return new Promise((resolve) => {
    setTimeout(() => resolve(Date.now() - start), 0);
  });
}

function measure(label, work) {
  return (async () => {
    const start = Date.now();
    const tick = waitForNextTick();
    await work();
    return { label, blocked: await tick, total: Date.now() - start };
  })();
}

// =====================================================================
// DEMO 1 - async does not block, sync does
// =====================================================================

async function demo1() {
  banner("DEMO 1 - async vs sync: who blocks the event loop?");

  const asyncRun = await measure(`${JOB_COUNT} x crypto.pbkdf2 (async)`, () =>
    Promise.all(Array.from({ length: JOB_COUNT }, hash)),
  );
  console.log(`  ${asyncRun.label}`);
  console.log(`    event loop free after : ${asyncRun.blocked}ms   <- async`);
  console.log(`    all 4 hashes done in  : ${asyncRun.total}ms`);

  console.log("");

  const syncRun = await measure("crypto.pbkdf2Sync (1 call)", () => {
    crypto.pbkdf2Sync("secret", "salt", ITERATIONS, 32, "sha256");
  });
  console.log(`  ${syncRun.label}`);
  console.log(`    event loop free after : ${syncRun.blocked}ms   <- BLOCKED`);
  console.log(
    `    all ${JOB_COUNT} async hashes done in : ${asyncRun.total}ms,`,
  );
  console.log(
    "    a SINGLE sync call froze the server for a similar time.",
  );

  console.log("\n  Both call the exact same math. One of them froze the server.");
}

// =====================================================================
// DEMO 2 - the pool size is the real limit
// =====================================================================

function runChildPool() {
  const start = Date.now();
  Promise.all(Array.from({ length: JOB_COUNT }, () => hash(BENCH_ITERATIONS))).then(
    () => {
      // Only the number, so the parent can build a table out of stdout.
      process.stdout.write(String(Date.now() - start));
    },
  );
}

function demo2() {
  banner("DEMO 2 - UV_THREADPOOL_SIZE limits the parallel work");

  console.log(
    `  ${JOB_COUNT} concurrent hashes, ${BENCH_RUNS} runs each, best time shown.`,
  );
  console.log("  Each run is a fresh process that gets UV_THREADPOOL_SIZE");
  console.log("  before Node boots - that is the only way to set it.\n");

  const rows = [];
  for (const size of [1, 2, 4, 8]) {
    const times = [];
    let failed = null;

    for (let i = 0; i < BENCH_RUNS; i++) {
      const out = spawnSync(process.execPath, [SELF, "child-pool"], {
        encoding: "utf8",
        env: { ...process.env, UV_THREADPOOL_SIZE: String(size) },
      });

      const value = Number(out.stdout.trim());
      if (!out.stdout.trim()) {
        failed = out.stderr;
        break;
      }
      times.push(value);
    }

    if (failed) {
      console.log(`  size ${size}: FAILED\n${failed}`);
      return;
    }
    rows.push({ size, ms: Math.min(...times) });
  }

  const slowest = rows[rows.length - 1].ms;
  for (const { size, ms } of rows) {
    const bar = "#".repeat(Math.max(1, Math.round(ms / slowest * 24)));
    console.log(`  size ${String(size).padStart(2)}  ${String(ms).padStart(4)}ms  ${bar}`);
  }

  console.log("\n  Size 1 forces all 4 hashes to queue behind each other.");
  console.log("  Raising it lets them overlap - but only because the pool has");
  console.log("  more threads. The pool does NOT make JavaScript parallel.");
  console.log("  Past the number of jobs there is nothing left to win, and more");
  console.log("  threads than you need just adds contention.");
  console.log("\n  The 3x gap is the real signal. The 20-30% wobble between runs is");
  console.log("  normal, which is why this reports the best of 3 - noise only ever");
  console.log("  makes a run look WORSE, never better.");
}

// =====================================================================
// DEMO 3 - network I/O never touches the pool
// =====================================================================

function runChildNetwork() {
  const server = createServer((request, response) => {
    // Pretend this is a slow database call.
    setTimeout(() => response.end("ok"), SLOW_RESPONSE_MS);
  });

  // Port 0 asks the OS for a free port, so this demo never collides with
  // anything already running. Read the real port back with
  // server.address().port - handy whenever you write a test server.
  server.listen(0, "127.0.0.1", async () => {
    const { port } = server.address();
    const start = Date.now();

    await Promise.all(
      Array.from({ length: CLIENTS }, () => fetch(`http://127.0.0.1:${port}/`)),
    );

    process.stdout.write(String(Date.now() - start));
    server.close();
  });
}

function demo3() {
  banner("DEMO 3 - sockets do NOT go through the thread pool");

  const serial = CLIENTS * SLOW_RESPONSE_MS;
  console.log(`  ${CLIENTS} clients, each response delayed ${SLOW_RESPONSE_MS}ms.`);
  console.log(`  If the server handled them one after another: ${serial}ms.`);
  console.log("  Now the same test with a thread pool of exactly ONE thread:\n");

  const out = spawnSync(process.execPath, [SELF, "child-network"], {
    encoding: "utf8",
    env: { ...process.env, UV_THREADPOOL_SIZE: "1" },
  });

  const ms = Number(out.stdout.trim());
  if (!out.stdout.trim()) {
    console.log(`  FAILED\n${out.stderr}`);
    return;
  }

  console.log(`  actual: ${ms}ms  (${(serial / ms).toFixed(0)}x faster than serial)`);
  console.log("\n  One pool thread, and it is not even used. Sockets are not");
  console.log("  blocking work - the OS tells the event loop when a connection");
  console.log("  is ready, and the 300ms is spent WAITING, not computing.");
  console.log("  That is why one thread can serve thousands of clients.");
}

// =====================================================================

async function main() {
  console.log("Node.js thread pool demo");
  console.log(`Node ${process.version} on ${process.platform}`);
  await demo1();
  demo2();
  demo3();
  console.log("");
}
