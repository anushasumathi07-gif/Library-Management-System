const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// ===============================
// ADD A BOOK
// ===============================
router.post("/", async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ===============================
// GET ALL BOOKS
// ===============================
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();

    res.json(books);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ===============================
// UPDATE A BOOK
// ===============================
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json({
      message: "Book updated successfully",
      book: book,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

// ===============================
// DELETE A BOOK
// ===============================
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;