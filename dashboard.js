import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let myChart = null;

// --- 1. CATEGORY DICTIONARY ---
const keywords = {
    endurance: ['run', 'walk', 'cycle', 'cycling', 'cardio', 'treadmill', 'hiking', 'swim'],
    static: ['plank', 'sit', 'hold', 'yoga', 'stretching', 'l-sit', 'bridge', 'flex'],
    bodyweight: ['pushup', 'pullup', 'burpee', 'situp', 'crunch', 'dip', 'hiit', 'squat jump']
};

// --- 2. AUTH & REAL-TIME SYNC ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Check if username or displayName exists
                const name = userData.username || userData.displayName || "USER";
                document.getElementById('user-display').innerText = name.toUpperCase();
                startCloudSync(user.uid);
            } else {
                window.location.href = "setup.html";
            }
        } catch (err) {
            console.error("Auth error:", err);
        }
    } else {
        window.location.href = "login.html";
    }
});

function startCloudSync(uid) {
    const q = query(collection(db, "workouts"), where("uid", "==", uid));
    onSnapshot(q, (snapshot) => {
        const list = document.getElementById('workout-list');
        list.innerHTML = "";
        let totalKm = 0, totalSec = 0, peakW = 0;
        const maxWeights = {};

        snapshot.forEach(docSnap => {
            const d = docSnap.data();
            const w = Number(d.weight) || 0;
            totalKm += (Number(d.distance) || 0);
            totalSec += (Number(d.duration) || 0);
            if (w > peakW) peakW = w;
            if (w > 0) maxWeights[d.exercise] = Math.max(maxWeights[d.exercise] || 0, w);

            const row = document.createElement('div');
            row.className = "log-item";
            
            let valDisplay = d.distance > 0 ? `${d.distance}km` : 
                             (d.duration > 0 ? `${d.duration}s` : 
                             (d.weight > 0 ? `${d.sets}x${d.reps} @ ${d.weight}kg` : `${d.sets}x${d.reps} BW`));

            row.innerHTML = `
                <div><strong>${d.exercise.toUpperCase()}</strong><br><small>${valDisplay}</small></div>
                <button class="del-btn" onclick="window.deleteEntry('${docSnap.id}')" style="background:transparent; border:none; color:#ff6b81; cursor:pointer; font-size:1.2rem;">&times;</button>
            `;
            list.appendChild(row);
        });

        document.getElementById('total-dist').innerText = `${totalKm.toFixed(2)} km`;
        document.getElementById('total-time').innerText = `${totalSec}s`;
        document.getElementById('peak-weight').innerText = `${peakW} kg`;
        document.getElementById('update-count').innerText = snapshot.size;
        renderChart(Object.keys(maxWeights), Object.values(maxWeights));
    });
}

// --- 3. UI SMART MODES ---
window.toggleInputs = (val) => {
    const v = (val || "").toLowerCase();
    const isEnd = keywords.endurance.some(k => v.includes(k));
    const isStat = keywords.static.some(k => v.includes(k));
    const isBw = keywords.bodyweight.some(k => v.includes(k));

    // Reset displays
    const modes = ['endurance-inputs', 'static-inputs', 'bodyweight-inputs', 'lifting-inputs'];
    modes.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });

    if (isEnd) document.getElementById('endurance-inputs').style.display = 'flex';
    else if (isStat) document.getElementById('static-inputs').style.display = 'flex';
    else if (isBw) document.getElementById('bodyweight-inputs').style.display = 'flex';
    else document.getElementById('lifting-inputs').style.display = 'flex';
};

// --- 4. DATA LOGGING ---
document.getElementById('workout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    const exField = document.getElementById('exercise');
    const exValue = exField.value.trim();
    const v = exValue.toLowerCase();

    const isEnd = keywords.endurance.some(k => v.includes(k));
    const isStat = keywords.static.some(k => v.includes(k));
    const isBw = keywords.bodyweight.some(k => v.includes(k));

    btn.innerText = "SYNCING...";
    
    try {
        // Safety grabber function to prevent "Check Console" errors
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? Number(el.value) : 0;
        };

        const payload = {
            uid: auth.currentUser.uid,
            exercise: exValue,
            sets: isStat ? getVal('static-sets') : (isBw ? getVal('bw-sets') : getVal('sets')),
            reps: isBw ? getVal('bw-reps') : (isEnd || isStat ? 0 : getVal('reps')),
            weight: (isEnd || isStat || isBw) ? 0 : getVal('weight'),
            distance: isEnd ? getVal('distance') : 0,
            duration: isStat ? getVal('duration') : 0,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "workouts"), payload);
        e.target.reset();
        window.toggleInputs("");
    } catch (err) {
        console.error("Save Error:", err);
        alert("Sync Failed: " + err.message);
    } finally {
        btn.innerText = "SYNC_DATA";
    }
});

// --- GLOBAL ATTACHMENTS ---
window.switchTab = (tabId, element) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    element.classList.add('active');
};

window.selectIdea = (name) => {
    const dashLink = document.querySelector('.nav-links a:first-child');
    window.switchTab('main-dash', dashLink);
    document.getElementById('exercise').value = name;
    window.toggleInputs(name);
};

window.deleteEntry = async (id) => {
    if (confirm("Delete this log?")) {
        try {
            await deleteDoc(doc(db, "workouts", id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    }
};

document.getElementById('exercise').addEventListener('input', (e) => window.toggleInputs(e.target.value));
document.getElementById('logout-btn').onclick = (e) => {
    e.preventDefault();
    signOut(auth);
};

function renderChart(labels, values) {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ data: values, backgroundColor: '#8e74e6', borderRadius: 6 }] },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}