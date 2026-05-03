/** * OMNI—DUAL | NEURAL CORE V62.6
 * FIX: VERSION MISMATCH & CHART COMPLEXITY
 */

var files = [null, null, null, null];

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('apiKeyIn').value = localStorage.getItem('omni_k') || '';
    document.getElementById('balIn').value = localStorage.getItem('omni_b') || '';
    document.getElementById('riskIn').value = localStorage.getItem('omni_r') || '';
});

function toggleSettings() { document.getElementById('settingsPanel').classList.toggle('hidden'); }

function saveCore(e) {
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
    if (!key) return alert("OMNI: KEY REQUIRED.");

    btn.disabled = true;
    btn.innerText = "PURGING COMPLEXITY...";

    try {
        const buffers = await Promise.all(files.map(f => f ? compressChart(f) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        const signal = await fetchNeuralSignal(key, buffers);
        console.log(signal);
    } catch (err) {
        alert("CRITICAL ERROR: API REJECTED. CHECK VERSION.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

async function compressChart(f) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                // Limit to 480px to avoid Complexity Errors
                const max = 480; 
                const scale = max / Math.max(img.width, img.height);
                cv.width = img.width * scale; cv.height = img.height * scale;
                const ctx = cv.getContext('2d');
                ctx.drawImage(img, 0, 0, cv.width, cv.height);
                resolve(cv.toDataURL('image/jpeg', 0.2)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, imgs) {
    // FORCE-LOCK TO SUPPORTED MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = document.getElementById('stratToggle').checked ? "SURGICAL DAY" : "AGGRESSIVE SCALP";
    
    const parts = [{ text: `Analyze charts for SMC ${mode}. Output JSON: {"bias":"BUY|SELL", "ticker":"SYM", "entry":0, "sl":0, "tp":0, "logic":"short"}` }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { response_mime_type: "application/json" } })
    });
    const json = await res.json();
    if (!json.candidates) throw new Error("VERSION_MISMATCH");
    return JSON.parse(json.candidates[0].content.parts[0].text);
}
