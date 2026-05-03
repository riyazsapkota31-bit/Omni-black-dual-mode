/** * OMNI—DUAL | NEURAL CORE V62.6
 * DEVELOPER: RIYAZ SAPKOTA
 * ARCHITECTURE: GEMINI 2.5 FLASH
 */

// --- GLOBAL STATE ---
var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

/**
 * SETTINGS & PERSISTENCE
 * Handles Hardware Link panel and local storage
 */
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('hidden');
}

function saveCore(e) {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;

    if (!k) return alert("OMNI: NEURAL_KEY REQUIRED.");

    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);

    // Visual feedback
    const btn = e.target;
    const originalText = btn.innerText;
    btn.innerText = "CORE SYNCED";
    btn.style.background = "#00f2ff";

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = "white";
        toggleSettings();
    }, 800);
}

// Load data on boot
window.onload = () => {
    document.getElementById('apiKeyIn').value = localStorage.getItem('omni_k') || '';
    document.getElementById('balIn').value = localStorage.getItem('omni_b') || '';
    document.getElementById('riskIn').value = localStorage.getItem('omni_r') || '';
};

/**
 * UPLOAD LOGIC
 * Handles multi-chart injection and UI masking
 */
function injectGallery(i) { 
    document.getElementById(`f${i}`).click(); 
}

function handleFile(i) {
    const input = document.getElementById(`f${i}`);
    const f = input.files[0];
    
    if (!f) return;

    files[i] = f;

    // UI Masking: Switch to 'Uploaded' Tick
    document.getElementById(`status${i}`).classList.add('hidden');
    document.getElementById(`tick${i}`).classList.remove('hidden');
    document.getElementById(`c${i}`).classList.add('active-box');

    // Fix: Clear input value so the same file can be re-uploaded/swapped
    input.value = null; 
}

/**
 * NEURAL PROCESSING ENGINE
 */
async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    if (files.filter(f => f).length < 2) {
        return alert("OMNI: LINK AT LEAST 2 CHARTS FOR ANALYSIS.");
    }
    if (!key) return alert("OMNI: HARDWARE LINK OFFLINE. CHECK SETTINGS.");

    btn.disabled = true;
    btn.innerText = "SQUASHING PAYLOAD...";

    try {
        // Step 1: Compress 4 charts to bypass API size limits
        const dataBuffers = await Promise.all(
            files.map(f => f ? compressChart(f) : Promise.resolve(null))
        );

        btn.innerText = "NEURAL HANDSHAKE...";

        // Step 2: API Transmission
        const signal = await fetchNeuralSignal(key, dataBuffers, isDay);
        
        // Step 3: UI Rendering
        displayOutput(signal);
        
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        alert("CRITICAL ERROR: API REJECTED. CHECK KEY OR REDUCE IMAGE SIZE.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

/**
 * SURGICAL COMPRESSION
 * Forces images into 512px max dimension @ 0.35 quality
 */
async function compressChart(f) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                const maxDim = 512; 
                const scale = maxDim / Math.max(img.width, img.height);
                
                cv.width = img.width * scale; 
                cv.height = img.height * scale;
                
                const ctx = cv.getContext('2d');
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, cv.width, cv.height);
                ctx.drawImage(img, 0, 0, cv.width, cv.height);
                
                resolve(cv.toDataURL('image/jpeg', 0.35));
            };
            img.onerror = () => reject("Img Load Error");
        };
        r.onerror = () => reject("File Read Error");
    });
}

/**
 * GEMINI API INTEGRATION
 */
async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `[OMNI—V6] MODE: ${isDay ? "SURGICAL DAY" : "AGGRESSIVE SCALP"}.
    Analyze for SMC/ICT: Liquidity Sweeps, Market Displacement, and DXY correlation.
    Output valid JSON: {"bias":"BUY|SELL", "ticker":"SYM", "entry":number, "sl":number, "tp":number, "logic":"short summary", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { 
        if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); 
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: parts }], 
            generationConfig: { 
                response_mime_type: "application/json", 
                temperature: 0.1 
            } 
        })
    });

    if (!res.ok) throw new Error("API_REJECTED");
    
    const json = await res.json();
    const rawText = json.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

/**
 * OUTPUT RENDERING
 */
function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    // Lot Size Math
    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat(localStorage.getItem('omni_b'));
    const riskPct = parseFloat(localStorage.getItem('omni_r'));
    
    if (balance && riskPct && riskAmt > 0) {
        const div = ASSET_CALC[data.type] || 1;
        const lot = (balance * (riskPct / 100)) / (riskAmt * div);
        document.getElementById('lVal').innerText = lot.toFixed(3);
    }
    
    document.getElementById('logicLog').innerText = `${data.ticker} | ${data.conf}/8 CONF | ${data.logic}`;
}
