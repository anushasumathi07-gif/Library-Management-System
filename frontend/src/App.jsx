import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";

function App() {
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Add Book states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [totalCopies, setTotalCopies] = useState("");
  const [availableCopies, setAvailableCopies] = useState("");

  // Issue Book states
  const [bookId, setBookId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");

  // Return Book state
  const [transactionId, setTransactionId] = useState("");

  // QR scanned book
  const [scannedBookId, setScannedBookId] = useState("");

  // Book Search and Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] =
    useState("All");

  // Transaction Search and Filter
  const [transactionSearch, setTransactionSearch] =
    useState("");

  const [transactionStatusFilter, setTransactionStatusFilter] =
    useState("All");

  // ================= ADMIN DASHBOARD =================

  const totalBooks = books.reduce(
    (sum, book) =>
      sum + Number(book.totalCopies || 0),
    0
  );

  const availableBooks = books.reduce(
    (sum, book) =>
      sum + Number(book.availableCopies || 0),
    0
  );

  const issuedBooks =
    totalBooks - availableBooks;

  const overdueBooks = transactions.filter(
    (transaction) =>
      transaction.status === "Issued" &&
      new Date(transaction.issueDate).getTime() +
        14 * 24 * 60 * 60 * 1000 <
        new Date().getTime()
  ).length;

  // ================= GET BOOKS =================

  const getBooks = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/books"
      );

      const data = await response.json();

      setBooks(data);
    } catch (error) {
      console.error(
        "Error fetching books:",
        error
      );
    }
  };

  // ================= GET TRANSACTIONS =================

  const getTransactions = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions"
      );

      const data = await response.json();

      setTransactions(data);
    } catch (error) {
      console.error(
        "Error fetching transactions:",
        error
      );
    }
  };

  // ================= LOAD DATA =================

  useEffect(() => {
    getBooks();
    getTransactions();
  }, []);

  // ================= QR SCANNER =================

  useEffect(() => {
    const scanner =
      new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        false
      );

    scanner.render(
      (decodedText) => {
        setScannedBookId(
          decodedText
        );

        setBookId(decodedText);

        scanner
          .clear()
          .catch(() => {});
      },
      () => {}
    );

    return () => {
      scanner
        .clear()
        .catch(() => {});
    };
  }, []);

  // ================= ADD BOOK =================

  const addBook = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/books",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title,
            author,
            isbn,
            category,
            totalCopies:
              Number(totalCopies),
            availableCopies:
              Number(availableCopies),
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        alert(
          "Book added successfully!"
        );

        setTitle("");
        setAuthor("");
        setIsbn("");
        setCategory("");
        setTotalCopies("");
        setAvailableCopies("");

        getBooks();
      } else {
        alert(
          data.message ||
            "Failed to add book"
        );
      }
    } catch (error) {
      console.error(
        "Error adding book:",
        error
      );
    }
  };

  // ================= ISSUE BOOK =================

  const issueBook = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions/issue",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            bookId,
            studentName,
            studentId,
          }),
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        alert(
          "Book issued successfully!"
        );

        setBookId("");
        setStudentName("");
        setStudentId("");
        setScannedBookId("");

        getBooks();
        getTransactions();
      } else {
        alert(
          data.message ||
            "Failed to issue book"
        );
      }
    } catch (error) {
      console.error(
        "Error issuing book:",
        error
      );
    }
  };

  // ================= RETURN BOOK =================

  const returnBook = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions/return/" +
          transactionId,
        {
          method: "PUT",
        }
      );

      const data =
        await response.json();

      if (response.ok) {
        alert(
          "Book returned successfully!"
        );

        setTransactionId("");

        getBooks();
        getTransactions();
      } else {
        alert(
          data.message ||
            "Failed to return book"
        );
      }
    } catch (error) {
      console.error(
        "Error returning book:",
        error
      );
    }
  };

  // ================= FILTER BOOKS =================

  const filteredBooks =
    books.filter((book) => {
      const searchText =
        search.toLowerCase();

      const matchesSearch =
        book.title
          .toLowerCase()
          .includes(searchText) ||
        book.author
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        categoryFilter === "" ||
        (book.category &&
          book.category
            .toLowerCase()
            .includes(
              categoryFilter.toLowerCase()
            ));

      let matchesAvailability =
        true;

      if (
        availabilityFilter ===
        "Available"
      ) {
        matchesAvailability =
          book.availableCopies > 0;
      }

      if (
        availabilityFilter ===
        "Issued"
      ) {
        matchesAvailability =
          book.availableCopies <
          book.totalCopies;
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });

  // ================= CURRENTLY ISSUED =================

  const currentlyIssued =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        "Issued"
    );

  // ================= FILTER TRANSACTIONS =================

  const filteredTransactions =
    transactions.filter(
      (transaction) => {
        const searchText =
          transactionSearch.toLowerCase();

        const bookTitle =
          transaction.book?.title?.toLowerCase() ||
          "";

        const bookAuthor =
          transaction.book?.author?.toLowerCase() ||
          "";

        const studentName =
          transaction.studentName?.toLowerCase() ||
          "";

        const studentId =
          transaction.studentId?.toLowerCase() ||
          "";

        const matchesSearch =
          bookTitle.includes(
            searchText
          ) ||
          bookAuthor.includes(
            searchText
          ) ||
          studentName.includes(
            searchText
          ) ||
          studentId.includes(
            searchText
          );

        const matchesStatus =
          transactionStatusFilter ===
            "All" ||
          transaction.status ===
            transactionStatusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

  // ================= DOWNLOAD CSV =================

  const downloadCSV = () => {
    if (
      filteredTransactions.length ===
      0
    ) {
      alert(
        "No transactions available to download."
      );

      return;
    }

    const headers = [
      "Book Title",
      "Author",
      "Book ID",
      "Issued To",
      "Student ID",
      "Issue Timestamp",
      "Return Timestamp",
      "Current Status",
    ];

    const rows =
      filteredTransactions.map(
        (transaction) => [
          transaction.book?.title ||
            "Unknown",

          transaction.book?.author ||
            "Unknown",

          transaction.book?._id ||
            "Unknown",

          transaction.studentName ||
            "",

          transaction.studentId ||
            "",

          transaction.issueDate
            ? new Date(
                transaction.issueDate
              ).toLocaleString()
            : "",

          transaction.returnDate
            ? new Date(
                transaction.returnDate
              ).toLocaleString()
            : "",

          transaction.status ||
            "",
        ]
      );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(value);

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      "library_transactions.csv"
    );

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  };

  // ================= RETURN UI =================

  return (
    <div>
      <h1>
        Library Management System
      </h1>

      {/* ================= ADMIN DASHBOARD ================= */}

      <h2>Admin Dashboard</h2>

      <div>
        <div>
          <h3>Total Books</h3>
          <h2>{totalBooks}</h2>
        </div>

        <div>
          <h3>Available Books</h3>
          <h2>{availableBooks}</h2>
        </div>

        <div>
          <h3>Issued Books</h3>
          <h2>{issuedBooks}</h2>
        </div>

        <div>
          <h3>Overdue Books</h3>
          <h2>{overdueBooks}</h2>
        </div>
      </div>

      <hr />

      {/* ================= CURRENTLY ISSUED BOOKS ================= */}

      <h2>
        Currently Issued Books
      </h2>

      {currentlyIssued.length ===
      0 ? (
        <p>
          No books are currently
          issued.
        </p>
      ) : (
        <table
          border="1"
          cellPadding="10"
        >
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Author</th>
              <th>Borrower</th>
              <th>Student ID</th>
              <th>Issue Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {currentlyIssued.map(
              (transaction) => (
                <tr
                  key={
                    transaction._id
                  }
                >
                  <td>
                    {
                      transaction.book
                        ?.title
                    }
                  </td>

                  <td>
                    {
                      transaction.book
                        ?.author
                    }
                  </td>

                  <td>
                    {
                      transaction.studentName
                    }
                  </td>

                  <td>
                    {
                      transaction.studentId
                    }
                  </td>

                  <td>
                    {transaction.issueDate
                      ? new Date(
                          transaction.issueDate
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {
                      transaction.status
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      <hr />

      {/* ================= ADD BOOK ================= */}

      <h2>Add New Book</h2>

      <form onSubmit={addBook}>
        <input
          type="text"
          placeholder="Book Title"
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) =>
            setAuthor(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="ISBN"
          value={isbn}
          onChange={(e) =>
            setIsbn(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) =>
            setCategory(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Total Copies"
          value={totalCopies}
          onChange={(e) =>
            setTotalCopies(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Available Copies"
          value={
            availableCopies
          }
          onChange={(e) =>
            setAvailableCopies(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <button type="submit">
          Add Book
        </button>
      </form>

      <hr />

      {/* ================= QR SCANNER ================= */}

      <h2>
        Scan Book QR Code
      </h2>

      <div id="qr-reader"></div>

      {scannedBookId && (
        <p>
          Scanned Book ID:{" "}
          <b>
            {scannedBookId}
          </b>
        </p>
      )}

      <hr />

      {/* ================= ISSUE BOOK ================= */}

      <h2>Issue Book</h2>

      <form onSubmit={issueBook}>
        <input
          type="text"
          placeholder="Book ID"
          value={bookId}
          onChange={(e) =>
            setBookId(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Student Name"
          value={studentName}
          onChange={(e) =>
            setStudentName(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) =>
            setStudentId(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <button type="submit">
          Issue Book
        </button>
      </form>

      <hr />

      {/* ================= RETURN BOOK ================= */}

      <h2>Return Book</h2>

      <form onSubmit={returnBook}>
        <input
          type="text"
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(e) =>
            setTransactionId(
              e.target.value
            )
          }
        />

        <br />
        <br />

        <button type="submit">
          Return Book
        </button>
      </form>

      <hr />

      {/* ================= SEARCH AND FILTER BOOKS ================= */}

      <h2>
        Search and Filter Books
      </h2>

      <input
        type="text"
        placeholder="Search by Title or Author"
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
      />

      <br />
      <br />

      <select
        value={categoryFilter}
        onChange={(e) =>
          setCategoryFilter(
            e.target.value
          )
        }
      >
        <option value="">
          All Categories
        </option>

        {[
          ...new Set(
            books
              .map(
                (book) =>
                  book.category
              )
              .filter(Boolean)
          ),
        ].map(
          (categoryName) => (
            <option
              key={
                categoryName
              }
              value={
                categoryName
              }
            >
              {categoryName}
            </option>
          )
        )}
      </select>

      <br />
      <br />

      <select
        value={
          availabilityFilter
        }
        onChange={(e) =>
          setAvailabilityFilter(
            e.target.value
          )
        }
      >
        <option value="All">
          All Books
        </option>

        <option value="Available">
          Available
        </option>

        <option value="Issued">
          Issued
        </option>
      </select>

      <hr />

      {/* ================= BOOK LIST ================= */}

      <h2>Books</h2>

      {filteredBooks.length ===
      0 ? (
        <p>
          No books found
        </p>
      ) : (
        <ul>
          {filteredBooks.map(
            (book) => (
              <li
                key={
                  book._id
                }
              >
                <b>
                  {book.title}
                </b>{" "}
                by{" "}
                {book.author}

                <br />

                ISBN:{" "}
                {book.isbn}

                <br />

                Category:{" "}
                {book.category ||
                  "Not specified"}

                <br />

                Total Copies:{" "}
                {
                  book.totalCopies
                }

                <br />

                Available Copies:{" "}
                {
                  book.availableCopies
                }

                <br />

                <b>
                  Status:{" "}
                  {book.availableCopies >
                  0
                    ? "Available"
                    : "Issued"}
                </b>

                <br />

                Book ID:{" "}
                {book._id}

                <br />
                <br />

                <QRCodeSVG
                  value={
                    book._id
                  }
                  size={150}
                />

                <br />
                <br />
              </li>
            )
          )}
        </ul>
      )}

      <hr />

      {/* ================= TRANSACTION HISTORY ================= */}

      <h2>
        Issue / Return History
      </h2>

      {/* Transaction Search */}

      <input
        type="text"
        placeholder="Search by book, author, student name or ID"
        value={
          transactionSearch
        }
        onChange={(e) =>
          setTransactionSearch(
            e.target.value
          )
        }
      />

      <br />
      <br />

      {/* Transaction Status Filter */}

      <select
        value={
          transactionStatusFilter
        }
        onChange={(e) =>
          setTransactionStatusFilter(
            e.target.value
          )
        }
      >
        <option value="All">
          All Transactions
        </option>

        <option value="Issued">
          Issued
        </option>

        <option value="Returned">
          Returned
        </option>
      </select>

      <br />
      <br />

      {/* DOWNLOAD CSV BUTTON */}

      <button
        onClick={downloadCSV}
      >
        Download CSV Report
      </button>

      <br />
      <br />

      {filteredTransactions.length ===
      0 ? (
        <p>
          No matching transactions
          found
        </p>
      ) : (
        <table
          border="1"
          cellPadding="10"
        >
          <thead>
            <tr>
              <th>
                Book Title
              </th>

              <th>
                Author
              </th>

              <th>
                Book ID
              </th>

              <th>
                Issued To
              </th>

              <th>
                Student ID
              </th>

              <th>
                Issue Date
              </th>

              <th>
                Return Date
              </th>

              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map(
              (transaction) => (
                <tr
                  key={
                    transaction._id
                  }
                >
                  <td>
                    {
                      transaction
                        .book
                        ?.title ||
                      "Unknown"
                    }
                  </td>

                  <td>
                    {
                      transaction
                        .book
                        ?.author ||
                      "Unknown"
                    }
                  </td>

                  <td>
                    {
                      transaction
                        .book
                        ?._id ||
                      "Unknown"
                    }
                  </td>

                  <td>
                    {
                      transaction.studentName
                    }
                  </td>

                  <td>
                    {
                      transaction.studentId
                    }
                  </td>

                  <td>
                    {transaction.issueDate
                      ? new Date(
                          transaction.issueDate
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {transaction.returnDate
                      ? new Date(
                          transaction.returnDate
                        ).toLocaleString()
                      : "-"}
                  </td>

                  <td>
                    {
                      transaction.status
                    }
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;