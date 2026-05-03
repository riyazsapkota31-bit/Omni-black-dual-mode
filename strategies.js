/** * OMNI—DUAL | STRATEGIC ENGINE V62.6
 * FIX: API_REJECTED / CHECK VERSION
 */

let files = [null, null, null, null];

// PERSISTENCE ENGINE: Reloads your Trading Parameters
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
    if (!key) return alert("CRITICAL: CORE NOT SYNCED. ADD API_KEY.");

    btn.disabled = true;
    btn.innerText = "PURGING COMPLEXITY...";

    try {
        // Fix for 400 Bad Request: Optimizes Chart Resolution
        const buffers = await Promise.all(files.map(f => f ? compress(f) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        const result = await callNeuralEngine(key, buffers.filter(b => b));
        displayOutput(result);
    } catch (err) {
        alert("VERSION_MISMATCH: RE-SYNC API CORE.");
        console.error(err);
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
                const MAX_DIM = 480; 
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
    // FORCE-SYNC: Your account requires gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = document.getElementById('stratToggle').checked ? "SURGICAL DAY" : "AGGRESSIVE SCALP";
    const balance = localStorage.getItem('omni_b') || "1000";
    const risk = localStorage.getItem('omni_r') || "1";

    const promptText = `ANALYSIS_MODE: SMC ${mode}. 
    USER_BALANCE: $${balance} | RISK: ${risk}%. 
    Instructions: Verify 1H Bias, Liquidity Sweeps, and Displacement. 
    Output JSON ONLY: {"bias":"BUY/SELL", "logic":"[Restored SMC logic string]"}`;

    const parts = [{ text: promptText }];
    images.forEach(img => { parts.push({ inline_data: { mime_type: "image/jpeg", data: img } }); });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });
    
    const data = await response.json();
    if (!data.candidates) throw new Error("API_REJECTED");
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
