// =====================================================================
// Bookstore routes - mounted at /books by app.ts
// ---------------------------------------------------------------------
//   GET    /books        list every book (optional ?author= filter)
//   GET    /books/:id    fetch a single book
//   POST   /books        create a book
//   PATCH  /books/:id    update a book
//   DELETE /books/:id    delete a book
//
// The data lives in ./data.ts, an in-memory array that resets on restart.
// =====================================================================

import express, { type Router, type Request, type Response } from "express";
import books from "./data.ts";

// Shape of the JSON body expected by POST and PATCH.
//
// This describes the GOING-IN data only - it is not enforced. There is no
// runtime validation anywhere in this file, so TypeScript happily accepts
// a body of the wrong types (or no body at all) and the request still
// succeeds. A type is a promise to the compiler, not a check at runtime.
interface Book {
  title: string;
  author: string;
  year: number;
}

const router: Router = express.Router();

// ---------------------------------------------------------------------
// GET /books
// Returns every book. Accepts an optional ?author= query parameter that
// narrows the list, e.g. /books?author=David Thomas
//
// The 4th generic on Request is the query type, which is what makes
// req.query.author typed as string.
// ---------------------------------------------------------------------
router.get(
  "/",
  (req: Request<{}, {}, {}, { author: string }>, res: Response) => {
    const { author } = req.query;

    // Start with the whole list, then narrow it down only if a filter was
    // actually sent. No filter means every book is returned.
    let resultBooks = books;
    if (author) {
      resultBooks = books.filter((book) => book.author === author);
    }

    res.status(200).json({
      books: resultBooks,
    });
  },
);

// ---------------------------------------------------------------------
// GET /books/:id
// Returns a single book, or 404 when it does not exist.
//
// Route params are always strings, so +id converts it to a number before
// comparing against the numeric ids in the store. An unparseable id
// (e.g. /books/abc) becomes NaN, matches nothing, and falls through to
// the 404 branch.
// ---------------------------------------------------------------------
router.get("/:id", (req: Request<{ id: string }>, res: Response) => {
  let id = req.params.id;
  let book = books.find((book) => book.id === +id);

  if (book) {
    res.status(200).json({
      book,
    });
  } else {
    res.status(404).json({
      message: "Not available",
    });
  }
});

// ---------------------------------------------------------------------
// POST /books
// Appends a book to the store and reports 201 Created.
//
// NOTE: the generated id is written first and the request body is spread
// AFTER it, so an id sent in the body silently wins over the generated
// one. A body of {"id": 99, ...} therefore creates a book with id 99 and
// breaks the "id = length + 1" sequence.
//
// NOTE: nothing is validated, so wrong types (or an empty body, which
// produces a book containing only an id) are accepted as 201.
// ---------------------------------------------------------------------
router.post("/", (req: Request<{}, {}, Book>, res: Response) => {
  let book = req.body;
  books.push({ id: books.length + 1, ...book });

  res.status(201).json({
    message: "Book is Created",
  });
});

// ---------------------------------------------------------------------
// PATCH /books/:id
// Merges the request body into the matching book.
//
// NOTE: the two status codes here are not the conventional ones. 201
// means "created", so it is the wrong code for a book that was NOT found
// - 404 is expected there. 202 means "accepted for later processing",
// so 200 is expected for an update that has already finished.
//
// NOTE: spreading `data` last means the body can overwrite the book's id
// as well as its fields, which makes the book unreachable at its old URL.
// ---------------------------------------------------------------------
router.patch("/:id", (req: Request<{ id: string }, {}, Book>, res: Response) => {
  let data = req.body;
  let id = req.params.id;
  let index = books.findIndex((book) => book.id === +id);

  if (index === -1) {
    res.status(201).json({
      message: "Book is not found",
    });
  } else {
    // Spread the existing book first, then the incoming fields, so the
    // body only overrides the keys it actually contains.
    books[index] = {
      ...books[index],
      ...data,
    };

    res.status(202).json({
      message: "Book is updated",
    });
  }
});

// ---------------------------------------------------------------------
// DELETE /books/:id
// Reports the list with that book removed.
//
// NOTE: filter() builds a BRAND NEW array and stores it in the local
// resultBooks. `books` itself is never reassigned, so the book stays in
// the store and GET /books/:id right after this still finds it. The
// response only looks right because it serialises the filtered copy.
//
// NOTE: this also returns 200 + "book is deleted" when the id did not
// exist in the first place, so a missing id is indistinguishable from a
// successful delete.
// ---------------------------------------------------------------------
router.delete("/:id", (req: Request<{ id: string }>, res: Response) => {
  let id = +req.params.id;
  let resultBooks = books.filter((b) => b.id !== id);

  res.status(200).json({
    books: resultBooks,
    message: "book is deleted",
  });
});

export default router;
