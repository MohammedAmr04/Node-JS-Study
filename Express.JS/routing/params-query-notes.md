# Express.js — Route Params & Query Params

## 1. Route Parameters

Route parameters are dynamic values that are part of the URL path.

They are defined using `:`.

```ts
app.get("/users/:id", (req, res) => {
  console.log(req.params.id);
});
```

Request:

```text
GET /users/123
```

Result:

```ts
req.params.id
// "123"
```

The `:id` is the **parameter name**. The actual value comes from the URL.

```text
/users/:id
       ↑
       dynamic parameter

/users/123
       ↑
       actual value
```

### Why use route parameters?

Instead of:

```ts
app.get("/users/1", handler);
app.get("/users/2", handler);
app.get("/users/3", handler);
```

Use:

```ts
app.get("/users/:id", handler);
```

One route can now handle:

```text
/users/1
/users/2
/users/3
/users/100
```

---

## 2. Multiple Route Parameters

A route can have multiple parameters:

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
{
  userId: "10",
  postId: "55"
}
```

Access them with:

```ts
req.params.userId
req.params.postId
```

---

## 3. Route Params Are Strings

Even when a value looks like a number:

```text
GET /users/123
```

Express gives you:

```ts
req.params.id
// "123"
```

If you need a number:

```ts
const id = Number(req.params.id);
```

In real applications, validate the value before using it.

---

# 4. Query Parameters

Query parameters are values added to the URL after `?`.

Example:

```text
GET /users?page=2
```

Access them through:

```ts
req.query
```

Example:

```ts
app.get("/users", (req, res) => {
  console.log(req.query.page);
});
```

Result:

```ts
req.query.page
// "2"
```

---

## 5. Multiple Query Parameters

Example:

```text
GET /users?page=2&limit=20
```

```ts
app.get("/users", (req, res) => {
  const page = req.query.page;
  const limit = req.query.limit;
});
```

Result:

```text
page  → "2"
limit → "20"
```

---

# 6. Common Uses of Query Parameters

Query parameters are commonly used for:

### Pagination

```text
GET /users?page=2&limit=20
```

```ts
req.query.page
req.query.limit
```

### Search

```text
GET /users?search=mohammed
```

```ts
req.query.search
```

### Filtering

```text
GET /products?category=electronics
```

```ts
req.query.category
```

### Sorting

```text
GET /products?sort=price&order=asc
```

```ts
req.query.sort
req.query.order
```

---

# 7. Query Parameters Are Usually Optional

Given:

```ts
app.get("/users", (req, res) => {
  console.log(req.query.page);
});
```

This request:

```text
GET /users
```

does not contain `page`.

So:

```ts
req.query.page
```

may be `undefined`.

This differs from route parameters.

A route like:

```ts
/users/:id
```

requires the `id` segment for that route to match.

Query parameters are commonly optional.

---

# 8. Route Params vs Query Params

This is the most important distinction.

### Route Parameter

```text
/users/123
```

Route:

```ts
app.get("/users/:id", handler);
```

Access:

```ts
req.params.id
```

Usually used to identify a specific resource.

---

### Query Parameter

```text
/users?page=2
```

Route:

```ts
app.get("/users", handler);
```

Access:

```ts
req.query.page
```

Usually used for filtering, searching, sorting, pagination, or changing how a collection is returned.

---

## Side-by-side

| | Route Params | Query Params |
|---|---|---|
| Example | `/users/123` | `/users?page=2` |
| Express | `req.params` | `req.query` |
| Common purpose | Identify a resource | Filter / search / sort / paginate |
| Usually required? | Yes for the route to match | Usually no |
| Part of route path? | Yes | No |
| Route syntax | `:id` | `?page=2` |

---

# 9. Combining Params and Query

You can use both in the same request.

```text
GET /users/123/orders?page=2&limit=10
```

Route:

```ts
app.get("/users/:userId/orders", (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  res.json({
    userId,
    page,
    limit
  });
});
```

Result:

```ts
req.params
// { userId: "123" }

req.query
// { page: "2", limit: "10" }
```

Mental model:

```text
/users/123/orders?page=2&limit=10
        │                    │
        │                    └── Query parameters
        │
        └── Route parameter
```

---

# 10. Query Values Are Not Automatically Numbers

For:

```text
GET /users?page=2
```

do not assume:

```ts
req.query.page === 2
```

Treat it as a value that needs validation/conversion:

```ts
const page = Number(req.query.page ?? 1);
const limit = Number(req.query.limit ?? 10);
```

For production applications, validate query parameters rather than blindly trusting them.

---

# 11. Query Parameters Can Have Different Shapes

A query value is not always guaranteed to be a simple string.

For example:

```text
/users?tag=node&tag=express
```

can represent multiple values for `tag`.

So avoid assuming every `req.query` value is always a single string.

For production APIs, schema validation with a library such as Zod is a good approach.

---

# 12. Common API Patterns

### Pagination

```text
GET /products?page=1&limit=20
```

```ts
const { page, limit } = req.query;
```

### Search

```text
GET /products?search=laptop
```

```ts
const { search } = req.query;
```

### Filtering

```text
GET /products?category=electronics&status=active
```

```ts
const { category, status } = req.query;
```

### Sorting

```text
GET /products?sort=price&order=asc
```

```ts
const { sort, order } = req.query;
```

### Resource identification

```text
GET /products/123
```

```ts
const { id } = req.params;
```

---

# 13. Common Mistakes

Do not confuse:

```text
/users/123
```

with:

```text
/users?id=123
```

They are different API designs.

### Route parameter

```text
/users/123
```

```ts
req.params.id
```

### Query parameter

```text
/users?id=123
```

```ts
req.query.id
```

Also:

```ts
app.get("/users/:id", (req, res) => {
  req.params.id; // Correct
  req.query.id;  // Not the route parameter
});
```

And for:

```text
/users?page=2
```

use:

```ts
req.query.page;
```

not:

```ts
req.params.page;
```

---

# 14. Useful Mental Model

Remember this URL:

```text
GET /users/123?page=2&limit=10
         │       │
         │       └── Query parameters
         │
         └── Route parameter
```

Express gives you:

```ts
req.params
```

```ts
{
  id: "123"
}
```

and:

```ts
req.query
```

```ts
{
  page: "2",
  limit: "10"
}
```

---

# 15. Cheat Sheet

## Route Parameters

```ts
app.get("/users/:id", (req, res) => {
  const id = req.params.id;
});
```

Request:

```text
GET /users/123
```

Use when:

> Identifying a specific resource.

---

## Query Parameters

```ts
app.get("/users", (req, res) => {
  const { page, limit } = req.query;
});
```

Request:

```text
GET /users?page=2&limit=20
```

Use when:

> Filtering, searching, sorting, pagination, or changing how a collection is returned.

---

## Both Together

```ts
app.get("/users/:userId/orders", (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
});
```

Request:

```text
GET /users/123/orders?page=2&limit=10
```

```text
req.params
    ↓
{ userId: "123" }

req.query
    ↓
{ page: "2", limit: "10" }
```

---

# 16. Final Rule

```text
Route Params → "Which resource?"
Query Params → "How do I want the resource(s)?"
```

Example:

```text
GET /products/123?include=reviews
```

```text
/products/123
        ↑
        Which product?
        → req.params.id

?include=reviews
        ↑
        How should it be returned?
        → req.query.include
```

The two things to remember:

```ts
req.params
req.query
```

and how they map to:

```text
/users/:id
```

versus:

```text
/users?page=2
```
