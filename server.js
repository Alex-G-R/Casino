const express = require('express');
const path = require('path');
const mysql = require('mysql');


/* Set-up the app */

// Set up express
const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

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

// Route to serve the /main
app.get('/main', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.status(404).send('Page not found :)');
});