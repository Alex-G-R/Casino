function placeBet(choice) {
    let bet = parseFloat(document.getElementById('bet').value);
    if (isNaN(bet) || bet <= 0) {
        alert("Please enter a valid bet amount.");
        return;
    }

    fetch('/placeBet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bet })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('money').innerText = `$${(data.money).toFixed(2)}`;

            let total;

            // Animate the rolling dice using canvas
            let canvas1 = document.getElementById('diceCanvas1');
            let ctx1 = canvas1.getContext('2d');

            let canvas2 = document.getElementById('diceCanvas2');
            let ctx2 = canvas2.getContext('2d');

            let frames = 0;
            let maxFrames = 30;
            let rollInterval = setInterval(() => {
                frames++;
                // Clear canvas
                ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
                ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
                // Randomize dice images during rolling
                let randomDice1 = Math.floor(Math.random() * 6) + 1;
                let randomDice2 = Math.floor(Math.random() * 6) + 1;
                let image1 = new Image();
                let image2 = new Image();
                image1.src = 'assets/dice-still-' + randomDice1 + '.png'; // Change path accordingly
                image2.src = 'assets/dice-still-' + randomDice2 + '.png'; // Change path accordingly
                image1.onload = function () {
                    ctx1.drawImage(image1, 0, 0, canvas1.width, canvas1.height);
                };
                image2.onload = function () {
                    ctx2.drawImage(image2, 0, 0, canvas2.width, canvas2.height);
                };
                if (frames >= maxFrames) {
                    clearInterval(rollInterval);
                    let total = randomDice1 + randomDice2;

                    console.log(`total: ${total}`)

                    fetch('/rollDice', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ bet, choice, total })
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data.moneyToDisplay)
                            document.getElementById('money').innerText = `$${(data.moneyToDisplay).toFixed(2)}`;
                            document.getElementById('result').innerText = data.resultText;
                            document.getElementById('sumOfDice').innerText = total;
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('An error occurred. Please try again.');
                        });
                }
            }, 50); // Adjust interval time as needed
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });

}