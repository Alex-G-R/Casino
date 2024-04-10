const express = require('express');

// Set up express
const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Spin-up the server
app.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});