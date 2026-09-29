// =====================================================================
// Bookstore API - in-memory data store
// ---------------------------------------------------------------------
// This array IS the database. It lives only in memory, so every change
// is lost the moment the server restarts. There is no file and no disk.
//
// It is a single shared array: every file that imports it receives a
// reference to the SAME array, so books.push(...) or books[index] = ... 
// in the router is visible everywhere. Reassigning the variable here
// would not be - which is exactly why DELETE in books.routes.ts has no
// effect on the store.
//
// Each book has the shape { id, title, author, year }.
// =====================================================================

let books = [
  {
    id: 1,
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
  },
  {
    id: 2,
    title: "The Pragmatic Programmer",
    author: "David Thomas",
    year: 1999,
  },
];

export default books;
