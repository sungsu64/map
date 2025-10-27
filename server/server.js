const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', // 이 부분에 당신의 MySQL 사용자 이름
  password: '1234', // 이 부분에 당신의 비밀번호
  database: 'map'
});

connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to the database.");
});

app.get('/api/places', (req, res) => {
  const query = "SELECT * FROM places";
  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});