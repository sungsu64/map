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

// 새로운 장소 등록
app.post('/api/spots', (req, res) => {
  const { name, description, lat, lng, emotion, visited_date, is_public } = req.body;
  const q = 'INSERT INTO user_spots (name, description, lat, lng, emotion, visited_date, is_public) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(q, [name, description, lat, lng, emotion, visited_date, is_public], (err) => {
    if (err) res.status(500).send(err);
    else res.send({ success: true });
  });
});

// 모든 장소 가져오기
app.get('/api/spots', (req, res) => {
  const q = 'SELECT * FROM user_spots';
  db.query(q, (err, result) => {
    if (err) res.status(500).send(err);
    else res.json(result);
  });
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));