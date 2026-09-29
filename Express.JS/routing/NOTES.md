# Express.js 5 — Routing Notes

## 1. What is Routing?

**Routing** is the process of determining how an application responds to a client request for a specific HTTP method and URL path.

A route is mainly defined by:

1. **HTTP method** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.
2. **Route path** — such as `/users` or `/products/:id`
3. **Route handler** — the function that runs when the route matches.

```ts
app.get("/users", (req, res) => {
  res.send("Users");
});
```

This means:

> When a `GET` request is sent to `/users`, execute this handler.

### Basic flow

```text
Client
  │
  │ GET /users
  ▼
Express
  │
  │ Match method + path
  ▼
Route Handler
  │
  ▼
Response
```

---

# 2. Route Methods

Express provides methods for common HTTP methods:

```ts
app.get()
app.post()
app.put()
app.patch()
app.delete()
```

Example:

```ts
app.get("/users", (req, res) => {
  res.send("Get users");
});

app.post("/users", (req, res) => {
  res.send("Create user");
});

app.delete("/users", (req, res) => {
  res.send("Delete users");
});
```

The path can be the same while the HTTP method changes.

```text
GET    /users  → Get users
POST   /users  → Create user
DELETE /users  → Delete users
```

This is an important part of designing REST APIs.

---

# 3. Route Paths

The route path is the URL pattern that Express matches.

```ts
app.get("/", handler);
app.get("/users", handler);
app.get("/products", handler);
app.get("/products/123", handler);
```

For example:

```ts
app.get("/", (req, res) => {
  res.send("Home");
});

app.get("/users", (req, res) => {
  res.send("Users");
});

app.get("/products", (req, res) => {
  res.send("Products");
});
```

Requests:

```text
GET /          → Home
GET /users     → Users
GET /products  → Products
```

---

# 4. Route Parameters

Route parameters are dynamic values inside the route path.

Instead of creating separate routes:

```ts
app.get("/users/123", handler);
app.get("/users/456", handler);
app.get("/users/789", handler);
```

Use a route parameter:

```ts
app.get("/users/:id", (req, res) => {
  console.log(req.params.id);
});
```

Now all of these can match:

```text
GET /users/123
GET /users/456
GET /users/789
```

The value is available through `req.params`:

```ts
req.params.id
```

For:

```text
GET /users/123
```

you get:

```ts
req.params.id
// "123"
```

For:

```text
GET /users/456
```

you get:

```ts
req.params.id
// "456"
```

## Why `:`?

In:

```ts
"/users/:id"
```

`:id` means:

> Match a dynamic path segment and store its value under the name `id`.

The `id` is the parameter name, not the actual value.

---

# 5. Multiple Route Parameters

A route can contain multiple parameters.

```ts
app.get("/users/:userId/posts/:postId", (req, res) => {
  console.log(req.params);
});
```

Request:

```text
GET /users/10/posts/55
```

Result:

```ts
req.params
```

```ts
{
  userId: "10",
  postId: "55"
}
```

This is useful for nested resources.

Example:

```text
/users/10/posts/55
```

can represent:

> Post `55` belonging to user `10`.

---

# 6. Route Parameters vs Query Parameters

This is one of the most important distinctions in Express.

## Route Parameters

URL:

```text
GET /users/123
```

Route:

```ts
app.get("/users/:id", (req, res) => {
  console.log(req.params.id);
});
```

Access:

```ts
req.params.id
```

Meaning:

> Get the specific user with ID `123`.

---

## Query Parameters

URL:

```text
GET /users?page=2&limit=10
```

Route:

```ts
app.get("/users", (req, res) => {
  console.log(req.query.page);
  console.log(req.query.limit);
});
```

Access:

```ts
req.query.page
req.query.limit
```

Meaning:

> Get users using page 2 with a limit of 10.

The query string does not change the route path.

The route is still:

```text
/users
```

while:

```text
?page=2&limit=10
```

is the query string.

---

# 7. Parameters vs Query vs Body

A useful way to remember them:

```text
/users/123
         ↑
      URL parameter
```

```ts
req.params.id
```

---

```text
/users?page=2
       ↑
    Query parameter
```

```ts
req.query.page
```

---

```text
POST /users
```

with JSON:

```json
{
  "name": "Mohammed",
  "email": "user@example.com"
}
```

Access it through:

```ts
req.body
```

### Quick comparison

| Location | Example | Express |
|---|---|---|
| Route parameter | `/users/123` | `req.params.id` |
| Query parameter | `/users?page=2` | `req.query.page` |
| Request body | JSON sent with POST | `req.body` |

---

# 8. Route Handlers

A route handler is the function that executes when a route matches.

```ts
app.get("/users", (req, res) => {
  res.json({
    users: []
  });
});
```

The handler receives:

```ts
(req, res)
```

where:

- `req` = request information
- `res` = response object

You will commonly use:

```ts
req.params
req.query
req.body
req.headers
req.method
req.url
```

and:

```ts
res.send()
res.json()
res.status()
res.end()
```

Example:

```ts
app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  res.json({
    id
  });
});
```

---

# 9. `next()`

Express routes and middleware can have multiple handlers.

```ts
app.get(
  "/users",
  (req, res, next) => {
    console.log("First handler");

    next();
  },
  (req, res) => {
    console.log("Second handler");

    res.send("Done");
  }
);
```

Flow:

```text
GET /users
    ↓
First handler
    ↓
next()
    ↓
Second handler
    ↓
Response
```

`next()` means:

> Pass control to the next middleware or handler in the chain.

This concept becomes extremely important when working with middleware.

---

# 10. Middleware

Middleware is a function that runs during the request/response lifecycle.

Example:

```ts
const logger = (req, res, next) => {
  console.log(req.method, req.url);

  next();
};
```

Use it in a route:

```ts
app.get("/users", logger, (req, res) => {
  res.json([]);
});
```

Flow:

```text
Request
   ↓
Logger middleware
   ↓
next()
   ↓
Users route handler
   ↓
Response
```

You can have multiple middleware functions:

```ts
app.get(
  "/users",
  middleware1,
  middleware2,
  middleware3,
  handler
);
```

Typical middleware responsibilities include:

- Logging
- Authentication
- Authorization
- Validation
- Parsing
- Error handling
- Request preprocessing

---

# 11. `next("route")`

`next("route")` is different from `next()`.

It tells Express to skip the remaining handlers for the current route and continue to the next matching route.

Example:

```ts
app.get("/users/:id", (req, res, next) => {
  if (req.params.id === "0") {
    return next("route");
  }

  res.send(`User ${req.params.id}`);
});

app.get("/users/:id", (req, res) => {
  res.send("Special user");
});
```

For:

```text
GET /users/5
```

the first route responds:

```text
User 5
```

For:

```text
GET /users/0
```

the first route calls:

```ts
next("route");
```

and Express continues to the next matching route.

### Important

You do not need to use `next("route")` frequently when starting with Express.

Understand the concept first.

---

# 12. Wildcard Routes

Express 5 supports wildcard route parameters.

Example:

```ts
app.get("/files/*filepath", (req, res) => {
  console.log(req.params.filepath);
});
```

Request:

```text
GET /files/images/logo.png
```

The wildcard can capture multiple path segments.

Conceptually:

```text
/files/
   │
   └── images/logo.png
```

The exact parameter value is available through:

```ts
req.params.filepath
```

In Express 5, wildcard parameters are named, and wildcard matches can contain multiple path segments.

---

# 13. Optional Route Segments

Express 5 supports optional route segments using `{}`.

Example:

```ts
app.get("/order{/:id}", (req, res) => {
  res.send("Order");
});
```

This can match:

```text
GET /order
```

and:

```text
GET /order/123
```

For:

```text
/order
```

there is no `id`.

For:

```text
/order/123
```

you get:

```ts
req.params.id
// "123"
```

This syntax is useful when part of a route is optional.

---

# 14. `app.all()`

`app.all()` matches requests for all HTTP methods on a specific path.

Example:

```ts
app.all("/secret", (req, res, next) => {
  console.log("Someone accessed /secret");

  next();
});
```

This can apply to:

```text
GET    /secret
POST   /secret
PUT    /secret
PATCH  /secret
DELETE /secret
```

A common use is applying a check or middleware to a specific path regardless of the HTTP method.

---

# 15. Route Order Matters

Express processes routes and middleware in the order in which they are registered.

Consider:

```ts
app.get("/users/:id", (req, res) => {
  res.send("User");
});

app.get("/users/admin", (req, res) => {
  res.send("Admin");
});
```

A request to:

```text
GET /users/admin
```

can match:

```text
/users/:id
```

with:

```text
id = "admin"
```

before reaching:

```text
/users/admin
```

Therefore, route ordering is important.

A safer order is:

```ts
app.get("/users/admin", (req, res) => {
  res.send("Admin");
});

app.get("/users/:id", (req, res) => {
  res.send("User");
});
```

### General rule

Put more specific routes before dynamic routes when they can overlap.

---

# 16. `express.Router()`

As an application grows, you should not put every route inside `app.ts` or `server.ts`.

Instead, group related routes using `express.Router()`.

Example structure:

```text
src/
├── app.ts
└── routes/
    └── users.ts
```

`routes/users.ts`:

```ts
import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json([]);
});

router.get("/:id", (req, res) => {
  res.json({
    id: req.params.id
  });
});

export default router;
```

Then in `app.ts`:

```ts
import usersRouter from "./routes/users.js";

app.use("/users", usersRouter);
```

Now:

```ts
router.get("/");
```

combined with:

```ts
app.use("/users", usersRouter);
```

becomes:

```text
GET /users
```

And:

```ts
router.get("/:id");
```

becomes:

```text
GET /users/:id
```

So:

```text
GET /users/123
```

will reach:

```ts
router.get("/:id", ...)
```

with:

```ts
req.params.id
// "123"
```

---

# 17. How `app.use()` + Router Work Together

Think of:

```ts
app.use("/users", usersRouter);
```

as:

> Any request starting with `/users` should be handled by `usersRouter`.

Then the router defines the remaining part of the path.

Example:

```ts
// app.ts

app.use("/users", usersRouter);
```

```ts
// users.ts

router.get("/", handler);
router.get("/:id", handler);
router.post("/", handler);
```

Final API:

```text
GET    /users
GET    /users/:id
POST   /users
```

This is one of the most common ways to structure an Express application.

---

# 18. Complete Routing Example

A small example combining the important concepts:

```ts
import express from "express";

const app = express();

app.use(express.json());

app.get("/users", (req, res) => {
  const page = req.query.page;

  res.json({
    page,
    users: []
  });
});

app.get("/users/:id", (req, res) => {
  const id = req.params.id;

  res.json({
    id
  });
});

app.post("/users", (req, res) => {
  const user = req.body;

  res.status(201).json({
    message: "User created",
    user
  });
});

app.delete("/users/:id", (req, res) => {
  const id = req.params.id;

  res.json({
    message: `User ${id} deleted`
  });
});
```

Possible requests:

```text
GET    /users
GET    /users?page=2
GET    /users/123
POST   /users
DELETE /users/123
```

Data access:

```text
GET /users/123
         ↓
req.params.id

GET /users?page=2
             ↓
req.query.page

POST /users + JSON body
             ↓
req.body
```

---

# 19. Mental Model

The most useful mental model is:

```text
                 HTTP Request
                      │
                      ▼
               ┌─────────────┐
               │   Express   │
               └──────┬──────┘
                      │
              Method + Path
                      │
                      ▼
               ┌─────────────┐
               │   Routing   │
               └──────┬──────┘
                      │
          ┌───────────┴───────────┐
          │                       │
    GET /users             GET /users/:id
          │                       │
          ▼                       ▼
      Handler                 req.params
          │                       │
          └───────────┬───────────┘
                      ▼
                  Response
```

With middleware:

```text
Request
   ↓
Middleware 1
   ↓
next()
   ↓
Middleware 2
   ↓
next()
   ↓
Route Handler
   ↓
Response
```

---

# 20. What You Should Focus on First

You do **not** need to memorize every routing syntax immediately.

Focus on these concepts first:

## Must understand

```text
1. app.get()
2. app.post()
3. app.put()
4. app.patch()
5. app.delete()

6. Route paths

7. Route parameters
   req.params

8. Query parameters
   req.query

9. Request and response
   req / res

10. next()

11. Middleware

12. express.Router()
```

## Learn later

```text
13. Multiple route handlers
14. next("route")
15. Wildcard routes
16. Optional route segments
17. Regular expression routes
18. app.all()
```

---

# 21. Quick Cheat Sheet

| Concept | Example | Access |
|---|---|---|
| Route | `GET /users` | `app.get("/users", ...)` |
| Route parameter | `/users/123` | `req.params.id` |
| Query parameter | `/users?page=2` | `req.query.page` |
| Request body | JSON body | `req.body` |
| Middleware | `logger` | `(req, res, next)` |
| Continue chain | `next()` | Next middleware/handler |
| Skip current route | `next("route")` | Next matching route |
| Router | `express.Router()` | Group related routes |
| All methods | `app.all()` | Any HTTP method |

---

# 22. The Most Important Distinction

Remember this:

```text
/users/123
        ↑
        params
```

```ts
req.params.id
```

versus:

```text
/users?page=2
       ↑
       query
```

```ts
req.query.page
```

versus:

```text
POST /users

{
  "name": "Mohammed"
}
```

```ts
req.body
```

These three concepts appear constantly when building APIs with Express.

---

# 23. Recommended Learning Order

After understanding routing, a good Express learning sequence is:

```text
Routing
   ↓
Middleware
   ↓
Request / Response
   ↓
Error Handling
   ↓
Express Router
   ↓
REST API structure
   ↓
Validation
   ↓
Authentication / Authorization
   ↓
Database integration
   ↓
Production structure
```

The key idea is:

> **Routing decides which code handles a request. Middleware can process the request before or around that handler, and `req.params`, `req.query`, and `req.body` provide different kinds of request data.**
