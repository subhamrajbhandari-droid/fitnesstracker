import { auth } from "./firebase-config.js";
// Changed version to 10.8.1 to match your other files
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');

// Added 'async' here
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');

    console.log("Attempting login for:", email);
    btn.disabled = true; // Prevent double-clicking
    btn.innerText = "CHECKING_IDENTITY...";

    try {
        // Using await for a cleaner network request
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login successful!");
        window.location.href = "dashboard.html"; 
    } catch (error) {
        console.error("Login Error Code:", error.code);
        
        // Detailed handling for the Network error
        if (error.code === 'auth/network-request-failed') {
            alert("SYSTEM_OFFLINE: Connection to Firebase was blocked. Please disable Ad-blockers or check your internet.");
        } else if (error.code === 'auth/invalid-credential') {
            alert("ACCESS_DENIED: Invalid email or code.");
        } else {
            alert("SYSTEM_ERROR: " + error.message);
        }
    } finally {
        btn.disabled = false;
        btn.innerText = "LOGIN_SYSTEM";
    }
});