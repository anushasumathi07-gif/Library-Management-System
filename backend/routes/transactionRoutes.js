const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Transaction = require("../models/Transaction");
const Book = require("../models/Book");


// ISSUE BOOK
router.post("/issue", async (req, res) => {
  try {
    const { bookId, studentName, studentId } = req.body;

    console.log("ISSUE REQUEST RECEIVED");
    console.log("Book ID:", bookId);

    // Check required fields
    if (!bookId || !studentName || !studentId) {
      return res.status(400).json({
        message: "Book ID, student name and student ID are required"
      });
    }

    // IMPORTANT: Validate ObjectId BEFORE findById()
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      console.log("INVALID BOOK ID");

      return res.status(400).json({
        message: "Invalid Book ID"
      });
    }

    console.log("VALID BOOK ID");

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        message: "Book not available"
      });
    }

    const existingTransaction = await Transaction.findOne({
      book: bookId,
      studentId: studentId,
      status: "Issued"
    });

    if (existingTransaction) {
      return res.status(400).json({
        message: "This student already has this book"
      });
    }

    const transaction = new Transaction({
      book: bookId,
      studentName: studentName,
      studentId: studentId,
      issueDate: new Date(),
      status: "Issued"
    });

    await transaction.save();

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      message: "Book issued successfully",
      transaction
    });

  } catch (error) {

    console.error("ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// RETURN BOOK
router.put("/return/:id", async (req, res) => {
  try {

    const transactionId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({
        message: "Invalid transaction ID"
      });
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    if (transaction.status === "Returned") {
      return res.status(400).json({
        message: "Book already returned"
      });
    }

    transaction.status = "Returned";
    transaction.returnDate = new Date();

    await transaction.save();

    const book = await Book.findById(transaction.book);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    book.availableCopies += 1;

    if (book.availableCopies > book.totalCopies) {
      book.availableCopies = book.totalCopies;
    }

    await book.save();

    res.json({
      message: "Book returned successfully",
      transaction
    });

  } catch (error) {

    console.error("RETURN ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// GET ALL TRANSACTIONS
router.get("/", async (req, res) => {
  try {

    const transactions = await Transaction.find()
      .populate("book")
      .sort({ issueDate: -1 });

    res.json(transactions);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });
  }
});


module.exports = router;