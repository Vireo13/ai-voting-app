// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://nprujvoypjqipdxwxmub.supabase.co";
// Replace the text below with your actual mega-long public/anon key from your dashboard!
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcnVqdm95cGpxaXBkeHd4bXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDAxMjMsImV4cCI6MjA5ODQxNjEyM30.3bLz2qxbjyjAGQdvvumXrj-KSxerZJ-B4PFllbTwycA"; 

const DB_URL = SUPABASE_URL + "/rest/v1/votes?id=eq.1";

const requestHeaders = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation" 
};

// --- DOM ELEMENTS ---
const proDisplay = document.getElementById("pro-display");
const antiDisplay = document.getElementById("anti-display");
const totalDisplay = document.getElementById("total-display");

// --- GLOBAL STATE ---
let proVotes = 0;
let antiVotes = 0;
let totalVotes = 0;
let currentUserVote = "none";

// --- FUNCTIONS ---

function updateScreen() {
    totalDisplay.textContent = totalVotes;

    let proPercentage = 0;
    let antiPercentage = 0;

    if (totalVotes > 0) {
        proPercentage = (proVotes / totalVotes) * 100;
        antiPercentage = (antiVotes / totalVotes) * 100;
    }

    proDisplay.textContent = proVotes + " votes (" + proPercentage.toFixed(1) + "%)";
    antiDisplay.textContent = antiVotes + " votes (" + antiPercentage.toFixed(1) + "%)";
}

function updateTotal() {
    totalVotes = antiVotes + proVotes;
    updateScreen();
}

// 1. VOTE PRO FUNCTION (Updates Supabase)
function votePro() {
    if (currentUserVote === "none") {
        proVotes++;
        currentUserVote = "pro";
    }
    else if (currentUserVote === "anti") {
        antiVotes--;
        proVotes++;
        currentUserVote = "pro";
    }
    
    updateTotal();

    // Send the updated counts to row 1 in your Supabase table
    fetch(DB_URL, {
        method: "PATCH",
        headers: requestHeaders,
        body: JSON.stringify({ 
            pro_count: proVotes,
            anti_count: antiVotes
        })
    })
    .then(response => response.json())
    .then(data => console.log("Database updated successfully with Pro vote!", data))
    .catch(error => console.error("Error updating database:", error));
}

// 2. VOTE ANTI FUNCTION (Updates Supabase)
function voteAnti() {
    if (currentUserVote === "none") {
        antiVotes++;
        currentUserVote = "anti";
    }
    else if (currentUserVote === "pro") {
        proVotes--;
        antiVotes++;
        currentUserVote = "anti";
    }
    
    updateTotal();

    // Send the updated counts to row 1 in your Supabase table
    fetch(DB_URL, {
        method: "PATCH",
        headers: requestHeaders,
        body: JSON.stringify({ 
            pro_count: proVotes,
            anti_count: antiVotes
        })
    })
    .then(response => response.json())
    .then(data => console.log("Database updated successfully with Anti vote!", data))
    .catch(error => console.error("Error updating database:", error));
}

// 3. POLLING FUNCTION (Asks Supabase for the global truth every 5 seconds)
function pollBackendForUpdates() {
    fetch(DB_URL, {
        method: "GET",
        headers: requestHeaders
    })
    .then(response => response.json())
    .then(data => {
        // Supabase sends data back as an array list, so we check data[0] for row 1
        if (data && data.length > 0) {
            proVotes = data[0].pro_count;
            antiVotes = data[0].anti_count;
            updateTotal();
        }
    })
    .catch(error => console.error("Polling error:", error));
}

// Start the live sync loop
setInterval(pollBackendForUpdates, 5000);

// Run it once immediately when the page loads so the user doesn't see zeroed layout
pollBackendForUpdates();