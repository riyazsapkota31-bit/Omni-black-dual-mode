/** * OMNI—DUAL | NEURAL CORE V62.6
 * DEVELOPER: RIYAZ SAPKOTA
 * FIXED: API REJECTION & MODEL COMPATIBILITY
 */

var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('apiKeyIn').value = localStorage.getItem('omni_k') || '';
    document.getElementById('balIn').value = localStorage.getItem('omni_b') || '';
    document.getElementById('riskIn').value = localStorage.getItem('omni_r') || '';
});

function toggleSettings() { document.getElementById('settingsPanel').classList.toggle('hidden'); }

function saveCore(e) {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;
    if (!k) return alert("OMNI: KEY REQUIRED.");
    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);
    const btn = e.target;
    btn.innerText = "CORE SYNCED";
    btn.style.background = "#00f2ff";
    setTimeout(() => {
        btn.innerText = "Sync Core";
        btn.style.background = "white";
        toggleSettings();
    }, 800);
}

function injectGallery(i) { document.getElementById(`f${i}`).click(); }

function handleFile(i) {
    const input = document.getElementById(`f${i}`);
    if (!input.files[0]) return;
    files[i] = input.files[0];
    document.getElementById(`status${i}`).classList.add('hidden');
    document.getElementById(`tick${i}`).classList.remove('hidden');
    document.getElementById(`c${i}`).classList.add('active-box');
    input.value = null; 
}

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const key = localStorage.getItem('omni_k');
    if (files.filter(f => f).length < 2) return alert("OMNI: LINK 2+ CHARTS.");
    if (!key) return alert("OMNI: OFFLINE. SETUP KEY.");

    btn.disabled = true;
    btn.innerText = "SQUASHING PAYLOAD...";

    try {
        const dataBuffers = await Promise.all(files.map(f => f ? compressChart(f) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        const signal = await fetchNeuralSignal(key, dataBuffers);
        displayOutput(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("CRITICAL ERROR: API REJECTED. CHECK VERSION");
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
                const maxDim = 512; // RESTRAINED TO BYPASS COMPLEXITY ERRORS
                const scale = maxDim / Math.max(img.width, img.height);
                cv.width = img.width * scale; cv.height = img.height * scale;
                const ctx = cv.getContext('2d');
                ctx.fillStyle = "#000"; ctx.fillRect(0,0,cv.width,cv.height);
                ctx.drawImage(img, 0, 0, cv.width, cv.height);
                resolve(cv.toDataURL('image/jpeg', 0.2)); // AGGRESSIVE COMPRESSION
            };
        };
    });
}

async function fetchNeuralSignal(key, imgs) {
    // UPDATED ENDPOINT FOR COMPATIBILITY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = document.getElementById('stratToggle').checked ? "SURGICAL DAY (CONSERVATIVE)" : "AGGRESSIVE SCALP (HIGH VOL)";
    const prompt = `[OMNI—V6] STRATEGY: ${mode}. Analyze charts for SMC/ICT. Output JSON: {"bias":"BUY|SELL", "ticker":"SYM", "entry":number, "sl":number, "tp":number, "logic":"short summary", "conf":1-8, "type":"CRYPTO|FOREX"}`;
    
    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    document.getElementById('biasTxt').innerText = data.bias;
    document.getElementById('biasTxt').className = `text-[120px] font-900 italic leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    const bal = parseFloat(localStorage.getItem('omni_b')) || 0;
    const risk = parseFloat(localStorage.getItem('omni_r')) || 0;
    const dist = Math.abs(data.entry - data.sl);
    if (bal > 0 && risk > 0 && dist > 0) {
        const div = ASSET_CALC[data.type] || 1;
        document.getElementById('lVal').innerText = ((bal * (risk/100)) / (dist * div)).toFixed(3);
    }
    document.getElementById('logicLog').innerText = `${data.ticker} | ${data.conf}/8 CONF | ${data.logic}`;
}
