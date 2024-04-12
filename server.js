const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');


/* Set-up the app */

// Set up express
const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

// Set up session management
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Spin-up the server
app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});


/* Set-up the SQL database connection */
const { mysql_connect_database } = require('./server_utils/mysql_func/mysql_connect_database.js');

// set up the connection constats
const SQL_HOST = "localhost";
const SQL_USER = "localhost";
const SQL_PASSWORD = "pass";
const SQL_DATABASE = "users";

// create the connection
const connection = mysql.createConnection({
    host: SQL_HOST,
    user: SQL_USER,
    password: SQL_PASSWORD,
    database: SQL_DATABASE
});

mysql_connect_database(connection, SQL_HOST, SQL_USER, SQL_DATABASE);

/* Handle routes */

// Route to serve the /login
app.get('/login', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    console.log(req.body)
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).send('Both username and password are required.');
    }

    // Query the database to check if the user exists
    connection.query('SELECT * FROM account WHERE login = ? AND password = ?', [username, password], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Internal server error.');
        }

        // Check if any rows are returned
        if (results.length > 0) {

            req.session.login = results[0].login;

            res.json({ message: 'Registration successful' }); // Send JSON response

        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

// Route to serve the /register
app.get('/register', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {

    console.log(req.body)
    const { full_name, username, password, email} = req.body; // Extract username and password from request body

    let sql = `INSERT INTO account (full_name, login, password, email) VALUES ('${full_name}', '${username}', '${password}', '${email}')`;
    
    console.log(sql)

    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });

    res.json({ message: 'Registration successful' }); // Send JSON response
});


// Route to serve the /register
app.get('/menu', (req,res) => {
    if (!req.session.login) {
        return res.status(401).send('Unauthorized');
    }

    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.status(404).send('Page not found :)');
});