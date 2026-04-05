import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('signup-btn');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    btn.innerText = "INITIALIZING...";

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            // Success: Move to Identity Setup
            window.location.href = "setup.html";
        })
        .catch((error) => {
            btn.innerText = "CREATE_ACCOUNT";
            alert(error.message);
        });
});