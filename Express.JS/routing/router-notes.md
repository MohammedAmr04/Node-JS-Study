# Express.js 5 — `express.Router()` & Nested Routers

Companion note to [`NOTES.md`](./NOTES.md). That file covers routing basics (`req.params`, `req.query`, middleware, `next()`). This one covers how to **split routes across files** and how **nested routers share route parameters**.

> All output shown here was verified against **Express 5.2.1** (Node 22).

---

## 1. Why Split Routes Into Routers?

Putting every route in `app.ts` works for a small app, but it does not scale.

```text
src/
├── app.ts          ← app setup only
└── routes/
    ├── users.ts    ← /users routes
    └── posts.ts    ← /posts routes
```

`routes/users.ts`:

```ts
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json([]);
});

router.get("/:id", (req, res) => {
  res.json({ id: req.params.id });
});

export default router;
```

`app.ts`:

```ts
import usersRouter from "./routes/users.js";

app.use("/users", usersRouter);
```

The mount path and the router path are **joined**, not replaced:

```text
app.use("/users", router)   +   router.get("/")
                        ↓
                    GET /users
```

```text
app.use("/users", router)   +   router.get("/:id")
                        ↓
                    GET /users/:id
```

So `GET /users/123` reaches `router.get("/:id")` with `req.params.id === "123"`.

---

## 2. Mounting a Router

```ts
app.use("/users", usersRouter);
```

Read it as:

> Any request whose path starts with `/users` should be handled by `usersRouter`.

| In `users.ts` | Final route |
|---|---|
| `router.get("/")` | `GET /users` |
| `router.get("/:id")` | `GET /users/:id` |
| `router.post("/")` | `POST /users` |

A router can be mounted on more than one path:

```ts
app.use("/users", usersRouter);
app.use("/admins", usersRouter); // same handlers, different prefix
```

---

## 3. The Problem: Nested Routers Lose Parent Params

This is where things get confusing.

Mount a router on a path that **contains a parameter**:

```ts
// app.ts
app.use("/users/:userId", usersRouter);
```

```ts
// users.ts
const router = Router();

router.get("/orders", (req, res) => {
  res.json({ params: req.params });
});
```

Request:

```text
GET /users/42/orders
```

You would expect `req.params` to contain `userId`, because the parent path defined it.

It does not:

```json
{ "params": {} }
```

`userId` is defined in the **parent** layer. The child router builds its own `req.params` from its own route path only.

### Verified

```ts
// app.ts
const child = Router();

child.get("/", (req, res) => res.json({ params: req.params }));

app.use("/users/:userId/plain", child);
```

```text
GET /users/42/plain   →   { "params": {} }
```

---

## 4. The Fix: `mergeParams: true`

```ts
import express, { Router } from "express";

const router = Router({ mergeParams: true });
```

This tells the router:

> Merge the params of the parent router into my own `req.params`.

### Before / After

Same app, two routers, mounted side by side:

```ts
// app.ts
const withoutMerge = Router();
const withMerge = Router({ mergeParams: true });

withoutMerge.get("/", (req, res) => res.json({ params: req.params }));
withMerge.get("/", (req, res) => res.json({ params: req.params }));

app.use("/users/:userId/plain", withoutMerge);
app.use("/users/:userId/merged", withMerge);
```

```text
GET /users/42/plain    →   { "params": {} }
GET /users/42/merged   →   { "params": { "userId": "42" } }
```

The child's own params are still added normally:

```ts
const router = Router({ mergeParams: true });

router.get("/:postId", (req, res) => {
  res.json({ params: req.params });
});
```

```text
GET /users/42/merged/7
```

```json
{ "params": { "userId": "42", "postId": "7" } }
```

Without `mergeParams` the same route returns only:

```json
{ "params": { "postId": "7" } }
```

---

## 5. Real Example: Users → Posts

Structure:

```text
src/
├── app.ts
└── routes/
    ├── users.ts
    └── posts.ts
```

`app.ts`:

```ts
import usersRouter from "./routes/users.js";

app.use("/users/:userId", usersRouter);
```

`routes/users.ts`:

```ts
import { Router } from "express";
import postsRouter from "./posts.js";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  res.json({ userId: req.params.userId });
});

router.use("/posts/:postId", postsRouter);

export default router;
```

`routes/posts.ts`:

```ts
import { Router } from "express";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const { userId, postId } = req.params;

  res.json({ userId, postId });
});

export default router;
```

Request:

```text
GET /users/42/posts/7
```

Inside `posts.ts` the handler sees **both** levels:

```json
{ "userId": "42", "postId": "7" }
```

### Getting the mount path right

Whatever you mount is **consumed**. Everything after it must match a route inside the child.

```text
GET /users/42/posts/7
    └── app.use("/users/:userId")        consumes "/users/42"
         └── router.use("/posts/:postId")  consumes "/posts/7"
              └── postsRouter.get("/")     must match "" (nothing left)
```

So the mount must be `"/posts/:postId"`, and the child route is `"/"` — the leading `/` is the leftover empty segment.

The other two shapes both return **404**, and the reason is not obvious until you count segments:

| `router.use(...)` in `users.ts` | Child receives | `postsRouter.get("/")` |
|---|---|---|
| `"/posts/:postId"` | `""` | matches |
| `"/:postId"` | `"/7"` | no match |
| `"/:postId/posts"` | `"/7"` | no match |

Notice `users.ts` also has `mergeParams: true`. It is not optional here — see the next section.

---

## 6. `mergeParams` Is NOT Transitive

This is the part that surprises most people, and the reason the flag goes on **every** level.

Each router only passes down the params **it actually holds**. If a router in the middle lacks the flag, it drops the ancestor params for everything below it.

Three-level chain:

```ts
app.use("/users/:userId/posts", level2);
```

```ts
// level2 mounts level3
level2.use("/:postId/comments", level3);

// leaf handler
level3.get("/:commentId", (req, res) => {
  res.json({ params: req.params });
});
```

Request:

```text
GET /users/42/posts/7/comments/3
```

| `level2` | `level3` | `req.params` |
|---|---|---|
| `mergeParams: true` | `mergeParams: true` | `{ userId, postId, commentId }` |
| no flag | `mergeParams: true` | `{ postId, commentId }` — `userId` lost |
| `mergeParams: true` | no flag | `{ commentId }` — everything above lost |

All three rows are verified output from Express 5.2.1.

### The rule

> Put `mergeParams: true` on every router whose handler needs a parameter defined by an **ancestor** mount path.

Setting it on a router that needs nothing costs nothing, so a common practical choice is to set it on every router that is mounted under a parameterized path.

---

## 7. Name Collisions: The Child Wins

If the parent and child use the **same** parameter name, the child's value overwrites the parent's.

```ts
app.use("/users/:userId/collision", router);
```

```ts
const router = Router({ mergeParams: true });

router.get("/:userId", (req, res) => {
  res.json({ params: req.params });
});
```

```text
GET /users/42/collision/99
```

```json
{ "params": { "userId": "99" } }
```

The parent's `42` is gone — it is not stored anywhere else.

### How to avoid it

Give each level a distinct name:

```text
/users/:userId/posts/:postId/comments/:commentId
```

Then every value survives, and reading them is unambiguous.

---

## 8. When You Do NOT Need `mergeParams`

If the mount path has no parameters, the flag does nothing useful:

```ts
app.use("/api/users", usersRouter); // no params in the mount path
```

`usersRouter` only needs it if some **ancestor** mount introduced a param.

Also note it only affects `req.params`. It has no effect on:

```text
req.query
req.body
req.headers
```

---

## 9. Common Mistakes

### Forgetting the flag on the middle router

```ts
// app.ts
app.use("/users/:userId", usersRouter); // userId comes from here

// users.ts  ← missing mergeParams: true
const router = Router();
router.use("/posts", postsRouter);
```

The handler in `posts.ts` will not see `userId`, and adding the flag only to `posts.ts` will not fix it. The break is at `users.ts`.

### Expecting `req.params` to be global

`req.params` is rebuilt at every router level. It is not one shared object that grows forever — it is a fresh merge at each layer, based on what that layer received.

### Using it when the parent param is not needed

Adding the flag everywhere "to be safe" makes the code misleading. It reads as if every route has nested params, when most do not.

### Confusing it with `app.use` without a path

```ts
app.use(usersRouter);
```

Mounting at the root does not merge anything, and the param behavior is unchanged. `mergeParams` only matters when params exist in an ancestor layer.

---

## 10. Cheat Sheet

| Concept | Code | Effect |
|---|---|---|
| Create a router | `Router()` | Group related routes |
| Mount a router | `app.use("/users", r)` | Prefix + hand off requests |
| Join paths | `app.use("/users", r)` + `r.get("/:id")` | `GET /users/:id` |
| Inherit parent params | `Router({ mergeParams: true })` | Parent params appear in `req.params` |
| Same name twice | `Router({ mergeParams: true })` + `/:userId` | Child value wins |

## 11. Final Mental Model

```text
app.use("/users/:userId", usersRouter)
        │
        └── ":userId" belongs to the PARENT layer
                    │
                    │  child router:  mergeParams: true ?
                    │
        ┌───────────┴───────────┐
        │                       │
       no                      yes
        │                       │
  req.params is            req.params is
  rebuilt from            parent params
  the child's             + the child's
  own path only           own params
                             │
                             ├── userId  (inherited)
                             └── postId  (child's own)
```

Two things to remember:

```ts
req.params
```

is **rebuilt at each router level**, not globally shared.

```ts
Router({ mergeParams: true })
```

is **per router**, not inherited downward — set it on every level that needs the ancestor's params.
