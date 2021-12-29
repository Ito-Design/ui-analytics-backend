const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 5000;
const cors = require("cors");
app.use(cors());
app.use(express.json());

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database/database.sqlite3", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connected to the SQlite database.");
});

app.get("/", (request, response) => response.send("Hello World!!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.get("/api/users", (req, res) => {
  const sql = "select * from users";
  const params = [];
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.json({
      message: "success",
      data: rows,
    });
  });
});

app.post("/api/auth/register/", (req, res) => {
  const insert = "INSERT INTO USERS (name, email, password) VALUES (?,?,?)";
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    db.run(insert, [req.body.name, req.body.email, hash], (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.json({
        message: "create User successfully",
        data: [req.body.name, req.body.email],
      });
    });
  });
});

app.post("/api/auth/login/", (req, res) => {
  console.log(req.body);
  const sql = "select * from users where email = ?";
  const params = [req.body.email];
  db.get(sql, params, (err, user) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!user) {
      return res.json({ message: "email not found" });
    }
    bcrypt.compare(req.body.password, user.password, (err, result) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!result) {
        return res.json({ message: "password is not correct" });
      }
      // return res.json({"message" : "password is correct"})

      const payload = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      const token = jwt.sign(payload, "secret");
      return res.json({ token });
    });
  });
});

app.get("/api/auth/user/", (req, res) => {
  const headers = req.headers;
  console.log(headers);
  const bearToken = req.headers["authorization"];
  const bearer = bearToken.split(" ");
  const token = bearer[1];

  jwt.verify(token, "secret", (err, user) => {
    if (err) {
      return res.sendStatus(403);
    } else {
      return res.json({
        user,
      });
    }
  });
});

// let sql = `CREATE TABLE PROJECT(
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   name TEXT,
//   pv INTEGER,
//   visit INTEGER,
//   domain TEXT,
//   tracking INTERGER affinity
//   )`;

// db.run(sql, (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log("table created");
// });

// const inserts =
//   "INSERT INTO PROJECT (name, pv, visit, domain, tracking) VALUES (?,?,?,?,?)";

// db.run(inserts, [
//   "テストプロジェクト",
//   "128",
//   "450",
//   "https://www.google.co.jp/",
//   1,
// ]);

app.get("/api/project", (req, res) => {
  const sql = "select * from project";
  const params = [];
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    return res.json({
      data: rows,
    });
  });
});

app.post("/api/project/register/", (req, res) => {
  const insert =
    "INSERT INTO PROJECT (name, pv, visit, domain, tracking) VALUES (?,?,?,?,?)";
  db.run(
    insert,
    [
      req.body.name,
      req.body.pv,
      req.body.visit,
      req.body.domain,
      req.body.tracking,
    ],
    (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return res.json({
        message: "create User successfully",
        data: [
          req.body.name,
          req.body.pv,
          req.body.visit,
          req.body.domain,
          req.body.tracking,
        ],
      });
    }
  );
});

app.get("/api/project/:id", (req, res) => {
  const sql = "select * from project where id = ?";
  db.get(sql, [req.params.id], (err, rows) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get("/api/project/del/:id", function (req, res) {
  db.serialize(() => {
    db.run("DELETE FROM project WHERE id = ?", req.params.id, function (err) {
      if (err) {
        res.send("Error encountered while deleting");
        return console.error(err.message);
      }
      res.send("Entry deleted");
      console.log("Entry deleted");
    });
  });
});

app.post("/api/project/update/:id", (req) => {
  const sql = "UPDATE project SET ? WHERE id = " + req.params.id;
  db.query(sql, req.body, function (err, result) {
    if (err) throw err;
    console.log(result);
  });
});

app.get("/api/project/edit/:id", (req, res) => {
  const sql = "SELECT * FROM project WHERE id = ?";
  db.query(sql, [req.params.id], function (err, result) {
    if (err) throw err;
    res.render("edit", { project: result });
  });
});
