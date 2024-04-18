const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcrypt');


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


// Route to serve the /register
app.get('/register',(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.post('/register', async (req, res) => {
    try {
        const { full_name, username, password, email } = req.body; // Extract data from request body

        // Check if the login is not taken
        const existingUsers = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM account WHERE login = ?', [username], (error, results) => {
                if (error) {
                    console.error('Error querying database:', error);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (existingUsers.length > 0) {
            // User found
            res.json({ message: 'This user exists' });
        }
        else 
        {
            // Hash the password with bcrypt
            const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

            // SQL query with placeholders for parameterized query
            let sql = 'INSERT INTO account (full_name, login, password, email) VALUES (?, ?, ?, ?)';

            // Parameter array
            let params = [full_name, username, hashedPassword, email];

            // Execute parameterized query
            connection.query(sql, params, function (err, result) {
                if (err) {
                    console.error('Failed to insert record:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                res.json({ message: 'Registration successful' });
            });
        }
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve the /this-user-exists
app.get('/this-user-exists', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'this-user-exists.html'));
});

// Route to serve the /login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if both username and password are provided
        if (!username || !password) {
            return res.status(400).send('Invalid username or password.');
        }

        // Query the database to check if the user exists
        connection.query('SELECT * FROM account WHERE login = ?', [username], async (error, results) => {
            if (error) {
                console.error('Error querying database:', error);
                return res.status(500).send('Internal server error.');
            }

            // Check if any rows are returned
            if (results.length > 0) {
                // User found
                const user = results[0];

                // Compare password with hash stored in database
                const isMatch = await bcrypt.compare(password, user.password);

                if (isMatch) {
                    // Password matches, set session details and respond with success
                    req.session.login = user.login;
                    req.session.cash = (user.cash).toFixed(2);

                    res.json({ message: 'Login successful' }); // Send JSON response
                } else {
                    // Password does not match
                    res.status(401).json({ message: 'Password is incorrect' });
                }

            } else {
                // User not found
                res.status(401).json({ message: 'Account not found' }); // Send JSON response
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to serve the /login fails
app.get('/login-account-fail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login-account-fail.html'));
});

app.get('/login-password-fail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login-password-fail.html'));
});

// Handle log-out fetch
app.post('/log-out', async (req, res) => {
    try {
        req.session.login = null;
        req.session.cash = null;

        res.json({ message: 'Log-out succesfull' }); // Send JSON response
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Route to serve the /register
app.get('/menu', (req, res) => {
    if(!req.session.login) { res.redirect('/login'); }
    else
    {
        const username = req.session.login;
        const cash = parseFloat(req.session.cash).toFixed(2);

        // Render your HTML template and pass the username to it
        res.render('menu', { username, cash });
    }   
});

/* games */

// Route to serve the /dice
app.get('/dice', (req, res) => {
    if(!req.session.login) { res.redirect('/login'); }
    else
    {
        const username = req.session.login;
        const cash = parseFloat(req.session.cash).toFixed(2);
        
        // Render your HTML template and pass the username to it
        res.render('dice', { username, cash });
    }   
});


// Route to handle dice roll and update cash
app.post('/rollDice', (req, res) => {

    const bet = parseFloat(req.body.bet);
    const choice = req.body.choice;
    const total = req.body.total;

    let winAmount;
    let resultText;

    const updateAndRespond = (amount) => {
        // Update moneyToDisplay after add_cash is done
        let moneyToDisplay = (req.session.cash).toFixed(2);
        res.json({ resultText, moneyToDisplay });
    };

    if (choice === 'more') {
        if (total > 7) {
            winAmount = (bet * 1.95).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login, updateAndRespond)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(0, req, res, req.session.login, updateAndRespond)
        }
    } else if (choice === 'less') {
        if (total < 7) {
            winAmount = (bet * 1.95).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login, updateAndRespond)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(0, req, res, req.session.login, updateAndRespond)
        }
    } else if (choice === 'equal') {
        if (total === 7) {
            winAmount = (bet * 4.85).toFixed(2);
            resultText = `You win $${winAmount}!`;
            add_cash(winAmount, req, res, req.session.login, updateAndRespond)
        } else {
            winAmount = 0;
            resultText = "You lose.";
            add_cash(0, req, res, req.session.login, updateAndRespond)
        }
    }
});

// Route to handle dice roll and update cash
app.post('/placeBet', (req, res) => {

    const bet = parseFloat(req.body.bet);

    let cash_status;

    const updateAndRespond = () => {
        // Update moneyToDisplay after add_cash is done
        let money = parseFloat(req.session.cash).toFixed(2);
        res.json({ money, cash_status });
    };

    if(parseFloat(bet) > parseFloat(req.session.cash))
    {
        cash_status = 0;
        add_cash(0, req, res, req.session.login, updateAndRespond)
    }
    else
    {
        cash_status = 1;
        add_cash(-bet, req, res, req.session.login, updateAndRespond)
    }
});

function add_cash(amount, req, res, username, callback) {

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
            // Save session
            req.session.save((err) => {
                if (err) {
                    // Handle error
                    console.error('Error saving session:', err);
                } else {
                    // Session saved successfully
                }
            });
            callback(); // Call the callback function to continue processing
        }
    );
}


// Route to serve the /blackjack
app.get('/blackjack', (req, res) => {
    if(!req.session.login) { res.redirect('/login'); }
    else
    {
        res.sendFile(path.join(__dirname, 'public', 'blackjack.html'));  
    }
});

// Route to serve the /roulette
app.get('/roulette', (req, res) => {
    if(!req.session.login) { res.redirect('/login'); }
    else
    {
        res.sendFile(path.join(__dirname, 'public', 'roulette.html'));   
    }
});

// Route to serve the /page-not-found
app.get('/page-not-found', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page-not-found.html'));
});

// Catch-all route for handling 404 errors
app.use((req, res) => {
    res.redirect('/page-not-found');
});
