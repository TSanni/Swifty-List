import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // important
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// LOCAL pgAdmin usage
// const db = new pg.Client({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// For use with Render
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Render requires SSL
  },
});

db.connect();

// GET items
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// POST a new item
// req.body will come from a viewModel function that gets the user input
app.post("/add", async (req, res) => {
  const newItemTitle = req.body.title;

  try {
    const result = await db.query(
      "INSERT INTO items (title) VALUES ($1) RETURNING *",
      [newItemTitle]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// PUT new title in place of current title
app.put("/edit/:id", async (req, res) => {
  const updatedTitle = req.body.title;
  const id = parseInt(req.params.id);

  try {
    const result = await db.query(
      "UPDATE items SET title = ($1) where id = ($2) RETURNING *",
      [updatedTitle, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).send("Item not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.delete("/delete/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await db.query(
      "DELETE FROM items where id = ($1) RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Item not found");
    }

    res.status(204).send(); // 204: No Content
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
