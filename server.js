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

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory for views
app.set('views', path.join(__dirname, 'views'));

// Set up session management
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
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
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
    console.log(req.body);
    const { username, password } = req.body;

    // Check if both username and password are provided
    if (!username || !password) {
        return res.status(400).send('Invalid username or password.');
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
            req.session.cash = results[0].cash;

            console.log("Login successful");
            res.json({ message: 'Login successful' }); // Send JSON response

        } else {
            console.log("Login not successful");
            res.status(401).json({ message: 'Authentication failed' }); // Send JSON response
        }
    });
});

// Route to serve the /register
app.get('/login-fail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login-fail.html'));
});

// Route to serve the /register
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', (req, res) => {

    console.log(req.body)
    const { full_name, username, password, email } = req.body; // Extract username and password from request body

    let sql = `INSERT INTO account (full_name, login, password, email) VALUES ('${full_name}', '${username}', '${password}', '${email}')`;

    console.log(sql)

    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });

    res.json({ message: 'Registration successful' }); // Send JSON response
});


// Route to serve the /register
app.get('/menu', (req, res) => {
    if (!req.session.login) {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    const username = req.session.login;
    const cash = req.session.cash;

    // Render your HTML template and pass the username to it
    res.render('menu', { username, cash });
});

/* games */

// Route to serve the /dice
app.get('/dice', (req, res) => {
    if (!req.session.login) {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    const username = req.session.login;
    const cash = req.session.cash;

    // Render your HTML template and pass the username to it
    res.render('dice', { username, cash });
});


// Route to handle dice roll and update cash
app.post('/rollDice', (req, res) => {
    const bet = parseFloat(req.body.bet);
    const choice = req.body.choice;
    const total = req.body.total;

    let winAmount;
    let resultText;

    if (choice === 'more') {
        if (total > 7) {
            winAmount = (bet * 2.2).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(-bet, req, res, req.session.login)
        }
    } else if (choice === 'less') {
        if (total < 7) {
            winAmount = (bet * 2.2).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(-bet, req, res, req.session.login)
        }
    } else if (choice === 'equal') {
        if (total === 7) {
            winAmount = (bet * 5.2).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(-bet, req, res, req.session.login)
        }
    }

    // For demonstration purposes, I'll send back the result and total to the client
    res.json({ resultText });
});

function add_cash(amount, req, res, username)
{
    
    let newCash = parseFloat(req.session.cash) + parseFloat(amount);

    connection.query(
        'UPDATE account SET cash = ? WHERE login = ?',
        [newCash, username],
        (error) => {
            if (error) {
                console.error('Error updating cash:', error);
                return res.status(500).send('Error updating cash');
            }
            req.session.cash = newCash; // Update cash in session
        }
    );
}

// Route to serve the /dice
app.get('/blackjack', (req, res) => {
    if (!req.session.login) {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    res.sendFile(path.join(__dirname, 'public', 'blackjack.html'));
});

// Route to serve the /dice
app.get('/roulette', (req, res) => {
    if (!req.session.login) {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }

    res.sendFile(path.join(__dirname, 'public', 'roulette.html'));
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.status(404).send('Page not found :)');
});