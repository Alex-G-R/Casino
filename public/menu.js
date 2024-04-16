// Function to handle playing a game
function playDice() {
    window.location.href = '/dice';
}

function playBlackjack() {
    window.location.href = '/blackjack';
}

function playRoulette() {
    window.location.href = '/roulette';
}

// logout
const logOutButton = document.getElementById('logOut');

logOutButton.addEventListener('click', () => {
    fetch('/log-out', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(data => {
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Error:', error);
        });
});