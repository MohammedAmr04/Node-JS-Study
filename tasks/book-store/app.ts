// =====================================================================
// Bookstore API - entry point
// ---------------------------------------------------------------------
// Run it with:   node tasks/book-store/app.ts
// (Node 22.18+ strips the TypeScript types itself, so there is no build
// step and no ts-node/tsx needed.)
//
// Start-up order matters: middleware and routes are registered on the
// app BEFORE app.listen() opens the port. The fallback handler is
// registered last so it only sees requests nothing else matched.
// =====================================================================

import express, { type Express, type Request, type Response } from "express";
import routesBooks from "./routes/books.routes.ts";

// The port the HTTP server listens on.
const PORT = 3000;

const app: Express = express();

// Middleware: parse a JSON request body and expose it as req.body.
// Without this, req.body would be undefined in the route handlers.
app.use(express.json());

// Mount the books router. Every route it defines is served under /books,
// so GET "/" inside books.routes.ts answers GET /books.
app.use("/books", routesBooks);

// Fallback handler for anything the routes above did not match.
//
// NOTE: app.use() matches EVERY http method AND every path that starts
// with "/", so this also answers POST/PUT/DELETE on unknown paths - and
// it answers with 200, which makes /anything look like a real page
// instead of a 404. app.get("/", ...) would scope it to GET / only.
app.use("/", (req: Request, res: Response) => {
  res.send("Server running good");
});

app.listen(PORT, () => {
  console.log("Server running on ", PORT);
});
