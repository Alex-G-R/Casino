
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
    };

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message)
        if(data.message == "Account not found")
        {
            window.location.href = '/login-account-fail';
        }
        else if(data.message == "Password is incorrect")
        {
            window.location.href = '/login-password-fail';
        }
        else if(data.message == "Login successful")
        {
            window.location.href = '/menu';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});