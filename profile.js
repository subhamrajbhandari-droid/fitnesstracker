import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- 1. LOAD USER DATA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // --- FETCH AND DISPLAY ACCOUNT ID ---
        const userIdElement = document.getElementById('user-id');
        if (userIdElement) {
            // Displaying the full ID (or you can use .substring(0, 10) for a shorter version)
            userIdElement.innerText = user.uid; 
            userIdElement.style.color = "var(--teal)"; // Optional: subtle highlight
        }

        // --- REST OF YOUR EXISTING LOGIC ---
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Fill your fields...
            if(document.getElementById('user-joined')) {
                 const joinedDate = data.joinedAt ? data.joinedAt.toDate().toLocaleDateString() : "RECENT";
                 document.getElementById('user-joined').innerText = joinedDate;
            }
        }
    } else {
        window.location.href = "login.html";
    }
});
// --- 2. UPDATE PROFILE LOGIC ---
const profileForm = document.getElementById('profile-edit-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        
        const updatedData = {
            displayName: document.getElementById('display-name').value,
            weight: document.getElementById('user-weight').value,
            height: document.getElementById('user-height').value,
            lastSync: new Date()
        };

        try {
            // setDoc with merge:true ensures it creates the doc if it doesn't exist
            await setDoc(userRef, updatedData, { merge: true });
            alert("✅ PROFILE_SYNCED_SUCCESSFULLY");
            
            // Update UI without refreshing
            document.getElementById('user-display').innerText = updatedData.displayName.toUpperCase();
            if(document.getElementById('preview-name')) document.getElementById('preview-name').innerText = updatedData.displayName;
        } catch (error) {
            console.error("Update Error:", error);
            alert("❌ SYNC_FAILED: Check database permissions.");
        }
    });
}

// --- 3. LOGOUT LOGIC ---
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => console.error("Logout Error:", error));
});