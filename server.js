require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public/common'));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/common');
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });

  app.post('/insert', upload.fields([{ name: 'logo' }, { name: 'image1' }]), async (req, res) => {
    const { feName, barangay, description, operatingHours, location, loc, locationDescription, ave, phone, email } = req.body;
    const textColumns = ['feName', 'barangay', 'description', 'operatingHours', 'location', 'loc', 'locationDescription', 'ave', 'phone', 'email'];
    const imageColumns = ['logo', 'image1'];
  
    try {
      const connection = await pool.getConnection();
   
      const textValues = textColumns.map(column => req.body[column]);
      const imageValues = imageColumns.map(column => req.files[column][0].filename);
      const values = [...imageValues, ...textValues];
  
      const insertQuery = `INSERT INTO images (${[...imageColumns, ...textColumns].join(', ')}) VALUES (${values.map(() => '?').join(', ')})`;
  
      const result = await connection.query(insertQuery, values);
  
      connection.release();
  
      console.log('Data inserted successfully');
      res.status(200).json({ message: 'Text and images uploaded successfully' });
    } catch (error) {
      console.error('Error uploading text and images:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });       
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const connection = await pool.getConnection();
        const [rows, fields] = await connection.execute('SELECT id, password FROM food WHERE username = ?', [username]);
        connection.release();

        if (rows.length > 0) {
        const hashedPassword = rows[0].password;
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (passwordMatch) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid credentials');
        }
        } else {
        res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('MySQL query error:', error);
        res.status(500).send('Error logging in');
    }
});
  
app.listen(8081, () => {
    console.log(`Server is running on http://localhost:8081`);
  });
  