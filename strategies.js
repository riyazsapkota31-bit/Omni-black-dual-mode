/** * OMNI—DUAL | NEURAL CORE V62.6
 * STRATEGY: DUAL-CORE SMC/ICT
 * MODEL: GEMINI-2.5-FLASH
 */

// --- 1. GLOBAL STATE & ASSET CONSTANTS ---
var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

// --- 2. HARD-HYDRATION: BOOT SEQUENCE ---
// This ensures data is saved and reloaded even after browser refresh
document.addEventListener('DOMContentLoaded', () => {
    const k = localStorage.getItem('omni_k');
    const b = localStorage.getItem('omni_b');
    const r = localStorage.getItem('omni_r');

    if (k) document.getElementById('apiKeyIn').value = k;
    if (b) document.getElementById('balIn').value = b;
    if (r) document.getElementById('riskIn').value = r;
    
    console.log("OMNI-DUAL: Hardware Link Online.");
});

// --- 3. GALLERY INJECTION & UI TAINTING ---
function injectGallery(i) { 
    document.getElementById(`f${i}`).click(); 
}

function handleFile(i) {
    const f = document.getElementById(`f${i}`).files[0];
    if(!f) return;
    
    files[i] = f;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = document.getElementById(`p${i}`);
        const card = document.getElementById(`c${i}`);
        const icon = document.getElementById(`i${i}`);
        
        // Transform UI to "Active" state
        img.src = e.target.result;
        img.classList.remove('opacity-0');
        card.classList.add('active-box'); // Adds the Cyan Glow
        icon.classList.add('hidden');    // Clears the icon for the chart
    };
    reader.readAsDataURL(f);
}

// --- 4. HARDWARE LINK COMMANDS ---
function toggleSettings() { 
    document.getElementById('settingsPanel').classList.toggle('hidden'); 
}

function saveCore() {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;

    // Direct commit to LocalStorage
    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);
    
    // UI Feedback
    const syncBtn = event.target;
    syncBtn.innerText = "CORE SYNCED";
    syncBtn.style.background = "#00f2ff";
    syncBtn.style.color = "#000";
    
    setTimeout(() => {
        syncBtn.innerText = "Sync Core";
        syncBtn.style.background = "white";
        toggleSettings();
    }, 1000);
}

// --- 5. EXECUTION ENGINE ---
async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    if (files.filter(f => f).length < 1) return alert("OMNI: NO CHART DATA.");
    if (!key) return alert("OMNI: API KEY NOT FOUND.");

    btn.disabled = true;
    btn.innerText = "LINKING NEURAL CORE...";

    try {
        // High-speed compression to prevent Tainted Canvas errors
        const dataBuffers = await Promise.all(files.map(f => f ? processImg(f) : Promise.resolve(null)));
        
        // Execute Gemini 2.5 Flash Link
        const signal = await fetchNeuralSignal(key, dataBuffers, isDay);
        
        displayOutput(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("CRITICAL ERROR: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

// --- 6. IMAGE BUFFER PROCESSING ---
async function processImg(f) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                const s = 1000 / Math.max(img.width, img.height);
                cv.width = img.width * s; cv.height = img.height * s;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                resolve(cv.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

// --- 7. NEURAL SIGNAL HANDLER ---
async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `[OMNI—DUAL CORE]
    MODE: ${isDay ? "SURGICAL DAY (1H/15M). MIN RR 1:4.0+" : "AGGRESSIVE SCALP (1M/15M). MIN RR 1:2.0+"}
    STRATEGY: SMC/ICT. Analyze charts for MSS, Liquidity, and Displacement.
    JSON_ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"SYMBOL", "entry":number, "sl":number, "tp":number, "logic":"short_reasoning", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    if (!res.ok) throw new Error("API REJECTED. CHECK HARDWARE LINK.");
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

// --- 8. UI RENDER & DYNAMIC LOTS ---
function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic tracking-tighter leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    // Dynamic Lot Calculation logic
    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat(localStorage.getItem('omni_b'));
    const riskPct = parseFloat(localStorage.getItem('omni_r'));
    
    if (balance && riskPct && riskAmt > 0) {
        const div = ASSET_CALC[data.type] || 1;
        const finalLot = ((balance * (riskPct / 100)) / (riskAmt * div));
        document.getElementById('lVal').innerText = finalLot.toFixed(4);
    }

    document.getElementById('logicLog').innerHTML = `
        <div class="flex justify-center gap-4 mb-8">
            <span class="bg-cyan-500/10 text-cyan-400 px-4 py-1 rounded-full text-[10px] font-black border border-cyan-500/20 uppercase">${data.ticker}</span>
            <span class="bg-white/5 text-white/30 px-4 py-1 rounded-full text-[10px] font-black border border-white/10 uppercase">${data.conf}/8 CONF</span>
        </div>
        <p class="text-center italic text-white/60">${data.logic}</p>
    `;
}
