// This code first includes the Node.js http module.

// Node.js has a fantastic standard library, including first-class support for networking.

// The createServer() method of http creates a new HTTP server and returns it.

// The server is set to listen on the specified port and host name. When the server is ready, the callback function is called, in this case informing us that the server is running.

import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 3000;

// Whenever a new request is received, the request event is called, providing two objects: a request (an http.IncomingMessage object) and a response (an http.ServerResponse object).

// Those 2 objects are essential to handle the HTTP call.

// The first provides the request details. In this simple example, this is not used, but you could access the request headers and request data.

// The second is used to return data to the caller.
const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

const x = 1;
const y = 2;
const z = 3;

console.count(
  "The value of x is " + x + " and has been checked .. how many times?",
);

console.count(
  "The value of x is " + x + " and has been checked .. how many times?",
);

console.count(
  "The value of y is " + y + " and has been checked .. how many times?",
);