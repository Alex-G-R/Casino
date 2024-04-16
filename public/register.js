document.getElementById('registrationForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission
    const formData = {
        full_name: document.getElementById('full_name').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        email: document.getElementById('email').value
    };

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.message == 'This user exists')
        {
            window.location.href = '/this-user-exists'
        }
        else if (data.message == 'Registration successful')
        {
            window.location.href = '/login';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});