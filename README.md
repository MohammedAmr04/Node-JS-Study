# Node-JS-Study

Personal study notes and hands-on exercises for learning Node.js and Express.js,
built as I work through the [Node.js Learn](https://nodejs.org/en/learn) material.

Modules 1 and 2 are plain JavaScript against the standard library: each numbered
folder is one module, with `Notes.md` holding the concepts and `index.js` the
runnable code. `Express.JS/` and `tasks/book-store/` are TypeScript and pull in
Express.

## About

| | |
|---|---|
| **Repository** | [github.com/MohammedAmr04/Node-JS-Study](https://github.com/MohammedAmr04/Node-JS-Study) |
| **Author** | [MohammedAmr04](https://github.com/MohammedAmr04) |
| **Runtime** | Node.js >= 20 for the JS modules, >= 22.18 for the TypeScript ones |
| **Type** | ESM (`"type": "module"`) |
| **Language** | JavaScript (modules 1-2), TypeScript (Express) |
| **Dependencies** | `express` at runtime, `typescript` + types for typechecking |

A taste of what the module 1 exercise does — a bare HTTP server using
nothing but the standard library:

```js
import { createServer } from "node:http";

const hostname = "127.0.0.1";
const port = 3000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

```bash
curl http://127.0.0.1:3000/
# Hello World
```

## Requirements

- [Node.js](https://nodejs.org)
  - **20 or newer** for the JavaScript modules (1 and 2)
  - **22.18 or newer** for the TypeScript projects — they are run directly
    with `node file.ts`, which relies on Node stripping the types itself
- npm (ships with Node)

```bash
node --version   # v20.x for modules 1-2, v22.18+ for the Express projects
```

## Getting started

```bash
git clone https://github.com/MohammedAmr04/Node-JS-Study.git
cd Node-JS-Study
npm install
```

`npm install` is needed once: it fetches Express plus the TypeScript compiler
and the type definitions. The JavaScript modules 1 and 2 have no dependencies of
their own, so they run before the install — only the Express projects need it.

### Study CLI

An interactive prompt for keeping track of what I'm studying:

```bash
npm start
```

```
Welcome to the Node.js study cli! Type 'exit' to quit.
> add javascript
Adding subject: javascript
> show
html js javascript
> exit
```

| Command | Description |
|---|---|
| `add <subject>` | Appends a subject to `subjects.json` |
| `remove <subject>` | Deletes a subject from `subjects.json` |
| `show` | Lists all subjects |
| `hello` | Greets back |
| `help` | Lists the available commands |
| `exit` | Quits the prompt |

Subjects persist between runs in `tasks/study-cli/subjects.json`.

### Module exercises

Any module's `index.js` can be run directly, or via the `server` script for
module 1:

```bash
npm run server
```

```
Server running at http://127.0.0.1:3000/
```

```bash
curl http://127.0.0.1:3000/
# Hello World
```

Module 2 holds three examples on ports 8080-8082. Pick one by setting
`CURRENT_EXAMPLE` at the top of its `index.js`:

```bash
npm run http
```

| `CURRENT_EXAMPLE` | Port | Shows |
|---|---|---|
| `1` | 8080 | Reflects the whole request back as JSON |
| `2` | 8081 | Reads the body with `pipe()` |
| `3` | 8082 | Routing: `POST /echo`, 404 for everything else |

The default is `1`, so the echo route needs `CURRENT_EXAMPLE = 3` first:

```bash
curl -X POST http://127.0.0.1:8082/echo -d "hello"
# hello
```

### Thread pool demo

The thread pool notes in module 1 come with a runnable demo. It measures how
long the event loop is blocked, re-runs itself with different
`UV_THREADPOOL_SIZE` values, and prints a timing table:

```bash
npm run thread-pool
```

It exits on its own, so it is safe to run anywhere.

## Express

The Express projects are TypeScript and run directly with `node` — Node 22.18+
strips the types itself, so there is no build step, no `ts-node`, and no `tsx`.
The files also import each other with an explicit `.ts` extension
(`./routes/books.routes.ts`), which is what makes that work without a bundler.

There are no npm scripts for these two yet, so run them by path:

### Hello world

```bash
node Express.JS/app.ts
```

```
Example app listening on port 3000
```

```bash
curl http://127.0.0.1:3000/
# Hello World!
```

### Routing notes

`Express.JS/routing/` is a three-file notes set, all in Express 5 syntax:

| File | Covers |
|---|---|
| `NOTES.md` | The routing surface end to end: methods, paths, route params, `next()`, middleware, `next("route")`, wildcards, optional `{}` segments, `app.all()`, route ordering, and how `app.use()` composes with a `Router` |
| `params-query-notes.md` | `req.params` vs `req.query` in depth — that params are always strings, that query values are optional and untyped, and the shapes they can take |
| `router-notes.md` | `express.Router()` and nesting: why a child router loses its parent's params, `mergeParams: true`, and why it is not transitive |

### Bookstore API

`tasks/book-store/` applies the notes to a small CRUD API. A router mounted at
`/books` over an in-memory array:

| Route | Does |
|---|---|
| `GET /books` | Lists every book; `?author=` filters the list |
| `GET /books/:id` | One book, or 404 |
| `POST /books` | Appends a book, answers 201 |
| `PATCH /books/:id` | Merges the request body into a book |
| `DELETE /books/:id` | Answers with the list minus that book |

```bash
node tasks/book-store/app.ts
```

```
Server running on  3000
```

```bash
curl http://127.0.0.1:3000/books
# {"books":[{"id":1,"title":"Clean Code",...},{"id":2,...}]}

curl "http://127.0.0.1:3000/books?author=David%20Thomas"
# {"books":[{"id":2,"title":"The Pragmatic Programmer",...}]}

curl -X POST http://127.0.0.1:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","author":"Martin Fowler","year":2018}'
# {"message":"Book is Created"}
```

The store is a plain array in `routes/data.ts`, so every change is lost when the
server restarts. See [Known issues](#known-issues) — the `DELETE` handler in
particular does not do what its response claims.

Both Express servers listen on **port 3000**, the same port as the module 1
server, so only one of them can run at a time.

## Repository structure

```
.
├── 1- Introduction-to-nodejs/     # Module 1: runtime overview + first exercises
│   ├── Notes.md                   #   Concepts: V8, event loop, thread pool, REPL
│   ├── index.js                   #   Exercises: http.createServer, console.count
│   └── thread-pool.js             #   Runnable demo: async vs sync, UV_THREADPOOL_SIZE
├── 2- HTTP/                       # Module 2: the http module
│   ├── Notes.md                   #   Request/response, streams, routing, layer breakdown
│   └── index.js                   #   Examples: echo server, pipe(), routing + 404
├── Express.JS/                    # Express 5, in TypeScript
│   ├── app.ts                     #   Hello world: GET and POST on /
│   └── routing/
│       ├── NOTES.md               #     Routing notes: methods, params, middleware, Router
│       ├── params-query-notes.md  #     req.params vs req.query
│       └── router-notes.md        #     express.Router(), nesting, mergeParams
├── tasks/
│   ├── study-cli/                 # Interactive subject tracker
│   │   ├── index.js               #   readline REPL + fs persistence
│   │   ├── subjects.json          #   Subject data (tracked)
│   │   └── subjects.txt           #   Scratch file from an abandoned text-storage experiment
│   └── book-store/                # Bookstore API applying the Express notes
│       ├── app.ts                 #   Entry point: json middleware, router mount, listen
│       └── routes/
│           ├── books.routes.ts    #     GET/POST/PATCH/DELETE over the store
│           └── data.ts            #     In-memory book array
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json                  # Typechecks the .ts files, noEmit + erasableSyntaxOnly
└── README.md
```

## Typecheck

`tsconfig.json` sits at the repo root and typechecks every `.ts` file. It sets
`noEmit` and `erasableSyntaxOnly`, so there is no build output — the compiler is
only a check.

```bash
npx tsc -p tsconfig.json
```

Because the config sets no `include`/`exclude` and no `allowJs`, the check covers
the four TypeScript files only — modules 1 and 2 are `.js` and are skipped:

```bash
npx tsc -p tsconfig.json --listFilesOnly
# Express.JS/app.ts
# tasks/book-store/app.ts
# tasks/book-store/routes/books.routes.ts
# tasks/book-store/routes/data.ts
```

## npm scripts

| Script | Does |
|---|---|
| `npm start` | Runs the study CLI |
| `npm run server` | Starts the module 1 HTTP server on port 3000 |
| `npm run http` | Runs the module 2 example server — edit `CURRENT_EXAMPLE` to pick which one |
| `npm run thread-pool` | Runs the thread pool demo: prints timings, then exits |

The Express projects and the typecheck have no script yet; run them directly
(`node Express.JS/app.ts`, `node tasks/book-store/app.ts`,
`npx tsc -p tsconfig.json`).

## Notes

- `npm start` changes into `tasks/study-cli/` first, because the CLI resolves
  `subjects.json` relative to the current working directory. Running
  `node tasks/study-cli/index.js` from the repo root instead reads and writes a
  **new** `subjects.json` in the root.
- `package.json` still declares `engines.node: ">=20"`, but the TypeScript
  projects need 22.18+ to be run directly. The constraint is only accurate for
  modules 1 and 2.
- The TypeScript files import with explicit `.ts` extensions
  (`rewriteRelativeImportExtensions` in `tsconfig.json`), which Node's own type
  stripping requires. Renaming those imports to `.js` breaks the direct run.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`), one logical change per commit.

## Known issues

### Study CLI issues

- The CLI's `help` output lists only `hello`, `help` and `exit` — it omits
  `add`, `remove` and `show`, which do work.
- Duplicate-subject detection in `add` is a no-op due to a missing call
  parentheses, so adding an existing subject creates a duplicate entry.
- The REPL `await`s each line of input but dispatches commands as
  fire-and-forget `fs` callbacks. Typing fast (or piping input in) lets the loop
  reach `exit` and end the process before those callbacks print, so the last
  command's output can be lost.

### Bookstore API issues

Deliberate follow-ups, recorded rather than quietly fixed. Each one is also
commented at its call site.

- `DELETE /books/:id` never mutates the store. `filter()` builds a new array
  into a local, so the book is still there on the next `GET /books/:id`. The
  response only *looks* right because it serialises the filtered copy. It also
  answers 200 for an id that never existed, so a missing book is
  indistinguishable from a deleted one.
- `POST /books` spreads the request body *after* the generated id, so a
  client-supplied `id` wins and breaks the `id = length + 1` sequence.
- `PATCH /books/:id` answers 201 for a book that was not found (404 is
  expected) and 202 for an update that has already finished (200 is expected).
  It also lets the body overwrite the book's `id`, which strands the book at
  its old URL.
- The `app.use("/")` fallback in `app.ts` answers **200** on every unmatched
  path, for every HTTP method, so `/anything` looks like a real page instead of
  a 404. `app.get("/", ...)` would scope it correctly.
- No runtime validation: a `Book` type on the request says nothing about the
  bytes on the wire, so a body of the wrong shape is still accepted as 201.

## Learn more

- [Node.js Learn](https://nodejs.org/en/learn)
- [Node.js API docs](https://nodejs.org/api/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express 5 docs](https://expressjs.com/en/guide/routing.html)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

