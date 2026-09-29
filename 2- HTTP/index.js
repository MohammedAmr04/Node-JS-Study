// =====================================================================
// Node.js HTTP module
// ---------------------------------------------------------------------
// The "http" module gives you a raw HTTP server. Everything an HTTP
// server does starts with createServer().
//
//  - http.createServer(callback) -> returns a server (but does NOT start it)
//  - server.listen(port, host, callback) -> starts listening
//
// The callback receives two objects on every incoming request:
//  - request  : http.IncomingMessage  (a READABLE stream  -> data coming in)
//  - response : http.ServerResponse  (a WRITABLE stream  -> data going out)
//
// Run one example at a time by changing CURRENT_EXAMPLE below:
//   1 -> reflect the whole request back as JSON
//   2 -> read the body using a pipe (shorter, no manual chunk juggling)
//   3 -> routing: respond only to POST /echo, 404 for everything else
// =====================================================================

import { createServer } from "node:http";

const CURRENT_EXAMPLE = 1;

const hostname = "127.0.0.1";

// Every example uses its own port so you can switch between them freely.
const ports = {
  1: 8080,
  2: 8081,
  3: 8082,
};

// =====================================================================
// EXAMPLE 1 - The full "reflect everything" server
// ---------------------------------------------------------------------
// Steps of every request:
//   1. read the request stream (data / end events)
//   2. decide a status code + headers
//   3. write the body and call response.end()
//
// Note: `request.url` is only the PATH (e.g. "/about?x=1"), it is not a
// full URL. Use `request.headers` for anything the client sent.
// =====================================================================

function example1() {
  const port = ports[1];

  const server = createServer((request, response) => {
    const { headers, method, url } = request;

    // "data" fires once per chunk. A chunk is a Buffer, NOT a string.
    let body = [];

    request
      .on("error", (err) => {
        console.error("request error:", err);
      })
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        // "end" fires when the client finished sending. Only now is the
        // body complete. Buffer.concat joins all the Buffers into one,
        // then .toString() decodes it to text.
        body = Buffer.concat(body).toString();

        response.on("error", (err) => {
          console.error("response error:", err);
        });

        // Two ways to set status + headers, both do the same thing:
        //   response.statusCode = 200;
        //   response.setHeader("Content-Type", "application/json");
        //   response.writeHead(200, { "Content-Type": "application/json" });
        response.writeHead(200, { "Content-Type": "application/json" });

        const responseBody = { headers, method, url, body };

        // response.write() streams a piece of the body (can be called many
        // times), response.end() flushes everything and closes the response.
        // Since we already have the full JSON we can do both in one call:
        //   response.write(JSON.stringify(responseBody));
        //   response.end();
        response.end(JSON.stringify(responseBody));
      });
  });

  return server.listen(port, hostname, () => {
    console.log(`Example 1 running at http://${hostname}:${port}/`);
  });
}

// =====================================================================
// EXAMPLE 2 - The same server, simplified with pipe()
// ---------------------------------------------------------------------
// A ReadableStream can be piped straight into a WritableStream, so
// `request.pipe(response)` echoes the body back with zero extra code.
//
// Keep the data/end version too: you need it whenever you have to read,
// validate, or transform the body instead of just forwarding it.
// =====================================================================

function example2() {
  const port = ports[2];

  const server = createServer((request, response) => {
    // Manual read, but short: the variable starts as an array of chunks.
    let body = [];

    request
      .on("data", (chunk) => {
        body.push(chunk);
      })
      .on("end", () => {
        body = Buffer.concat(body).toString();
        response.end(body);
      });

    // One line does exactly the same thing (uncomment to compare):
    //   request.pipe(response);
  });

  return server.listen(port, hostname, () => {
    console.log(`Example 2 running at http://${hostname}:${port}/`);
  });
}

// =====================================================================
// EXAMPLE 3 - Routing
// ---------------------------------------------------------------------
// A real server does not answer the same way to everything: it matches
// method + path, handles the match, and returns 404 when nothing matches.
//
// Read the body only AFTER the route check, so unknown routes are
// rejected before doing any work.
// =====================================================================

function example3() {
  const port = ports[3];

  const server = createServer((request, response) => {
    if (request.method === "POST" && request.url === "/echo") {
      let body = [];

      request
        .on("data", (chunk) => {
          body.push(chunk);
        })
        .on("end", () => {
          body = Buffer.concat(body).toString();
          response.end(body);
        });
    } else {
      // 404 = Not Found. statusCode MUST be set before end().
      response.statusCode = 404;
      response.end("Not found");
    }
  });

  return server.listen(port, hostname, () => {
    console.log(`Example 3 running at http://${hostname}:${port}/`);
    console.log(`Try:  curl -X POST http://${hostname}:${port}/echo -d "hi"`);
  });
}

// =====================================================================
// Run the selected example
// =====================================================================

const examples = {
  1: example1,
  2: example2,
  3: example3,
};

examples[CURRENT_EXAMPLE]();
