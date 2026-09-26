# Node-JS-Study

Personal study notes and hands-on exercises for learning Node.js, built as I work
through the [Node.js Learn](https://nodejs.org/en/learn) material. Each numbered
folder is one module: `Notes.md` holds the concepts, `index.js` holds the runnable
code for that module.

## About

| | |
|---|---|
| **Repository** | [github.com/MohammedAmr04/Node-JS-Study](https://github.com/MohammedAmr04/Node-JS-Study) |
| **Author** | [MohammedAmr04](https://github.com/MohammedAmr04) |
| **Runtime** | Node.js >= 20 |
| **Type** | ESM (`"type": "module"`) |
| **Dependencies** | None — standard library only |

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

- [Node.js](https://nodejs.org) 20 or newer
- npm (ships with Node)

There is nothing to install — the project has zero dependencies.

```bash
node --version   # v20.20.0 or newer
```

## Getting started

```bash
git clone https://github.com/MohammedAmr04/Node-JS-Study.git
cd Node-JS-Study
```

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

## Repository structure

```
.
├── 1- Introduction-to-nodejs/     # Module 1: runtime overview + first exercises
│   ├── Notes.md                   #   Concepts: V8, event loop, REPL
│   └── index.js                   #   Exercises: http.createServer, console.count
├── tasks/
│   └── study-cli/                 # Interactive subject tracker
│       ├── index.js               #   readline REPL + fs persistence
│       ├── subjects.json          #   Subject data (tracked)
│       └── subjects.txt           #   Scratch file from an abandoned text-storage experiment
├── .gitignore
├── package.json
└── README.md
```

## npm scripts

| Script | Does |
|---|---|
| `npm start` | Runs the study CLI |
| `npm run server` | Starts the module 1 HTTP server on port 3000 |

## Notes

- `npm start` changes into `tasks/study-cli/` first, because the CLI resolves
  `subjects.json` relative to the current working directory. Running
  `node tasks/study-cli/index.js` from the repo root instead reads and writes a
  **new** `subjects.json` in the root.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:`), one logical change per commit.

## Known issues

- The CLI's `help` output lists only `hello`, `help` and `exit` — it omits
  `add`, `remove` and `show`, which do work.
- Duplicate-subject detection in `add` is a no-op due to a missing call
  parentheses, so adding an existing subject creates a duplicate entry.
- The REPL `await`s each line of input but dispatches commands as
  fire-and-forget `fs` callbacks. Typing fast (or piping input in) lets the loop
  reach `exit` and end the process before those callbacks print, so the last
  command's output can be lost.

## Learn more

- [Node.js Learn](https://nodejs.org/en/learn)
- [Node.js API docs](https://nodejs.org/api/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

