/** * OMNI—DUAL | NEURAL CORE V62.6
 * DEBUGGED: Storage Persistence & Version Mismatch Fix
 */

let files = [null, null, null, null];

// INITIALIZE STORAGE ON LOAD
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('apiKeyIn').value = localStorage.getItem('omni_k') || '';
    document.getElementById('balIn').value = localStorage.getItem('omni_b') || '';
    document.getElementById('riskIn').value = localStorage.getItem('omni_r') || '';
});

function toggleSettings() { 
    document.getElementById('settingsPanel').classList.toggle('hidden'); 
}

function saveCore() {
    localStorage.setItem('omni_k', document.getElementById('apiKeyIn').value);
    localStorage.setItem('omni_b', document.getElementById('balIn').value);
    localStorage.setItem('omni_r', document.getElementById('riskIn').value);
    toggleSettings();
}

function injectGallery(i) { document.getElementById(`f${i}`).click(); }

function handleFile(i) {
    const input = document.getElementById(`f${i}`);
    if (!input.files[0]) return;
    files[i] = input.files[0];
    document.getElementById(`status${i}`).classList.add('hidden');
    document.getElementById(`tick${i}`).classList.remove('hidden');
    document.getElementById(`c${i}`).classList.add('active-box');
}

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const key = localStorage.getItem('omni_k');
    if (!key) return alert("CORE ERROR: KEY REQUIRED.");

    btn.disabled = true;
    btn.innerText = "PURGING COMPLEXITY...";

    try {
        // COMPRESSION PASS: Optimizes charts for API stability
        const buffers = await Promise.all(files.map(f => f ? compress(f) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        const result = await callNeuralEngine(key, buffers.filter(b => b));
        displayOutput(result);
    } catch (err) {
        // Updated error logic for version verification
        alert("CRITICAL ERROR: API REJECTED. CHECK VERSION.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

async function compress(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIM = 512; 
                const scale = MAX_DIM / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
            };
        };
    });
}

async function callNeuralEngine(key, images) {
    // FORCE-LOCK TO VERIFIED MODEL ENGINE
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = document.getElementById('stratToggle').checked ? "SURGICAL DAY" : "AGGRESSIVE SCALP";
    
    const parts = [
        { text: `SMC ANALYSIS: ${mode}. Focus on Liquidity Sweeps and Displacement. Output JSON ONLY: {"bias":"BUY|SELL", "logic":"brief summary"}` }
    ];
    
    images.forEach(img => {
        parts.push({ inline_data: { mime_type: "image/jpeg", data: img } });
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });
    
    const data = await response.json();
    if (!data.candidates) throw new Error("VERSION_MISMATCH");
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

function displayOutput(data) {
    const panel = document.getElementById('outPanel');
    const txt = document.getElementById('biasTxt');
    panel.classList.remove('hidden');
    txt.innerText = data.bias;
    txt.style.color = data.bias === "BUY" ? "#34d399" : "#fb7185";
    document.getElementById('logicLog').innerText = data.logic;
    panel.scrollIntoView({ behavior: 'smooth' });
}
