/** * OMNI—DUAL | NEURAL CORE V62.6
 * STRATEGY: DUAL-CORE SMC/ICT (Liquidity & Displacement)
 * MODEL: GEMINI-2.5-FLASH
 */

// 1. GLOBAL STATE & ASSET MULTIPLIERS
var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

// 2. BOOT SEQUENCE: HYDRATE TERMINAL
window.onload = () => {
    const key = localStorage.getItem('omni_k');
    const bal = localStorage.getItem('omni_b');
    const rsk = localStorage.getItem('omni_r');
    
    if (key) document.getElementById('apiKeyIn').value = key;
    if (bal) document.getElementById('balIn').value = bal;
    if (rsk) document.getElementById('riskIn').value = rsk;
    
    console.log("OMNI: CORE HYDRATED");
};

// 3. GALLERY INJECTION LOGIC
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
        
        // Apply "Tainted" Active state
        img.src = e.target.result;
        img.classList.remove('opacity-0');
        card.classList.add('active-box'); 
        icon.classList.add('hidden');
    };
    reader.readAsDataURL(f);
}

// 4. HARDWARE LINK PERSISTENCE
function toggleSettings() { 
    document.getElementById('settingsPanel').classList.toggle('hidden'); 
}

function saveCore() {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;

    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);
    
    const syncBtn = event.target;
    syncBtn.innerText = "CORE SYNCED";
    syncBtn.style.background = "#00f2ff";
    
    setTimeout(() => {
        syncBtn.innerText = "Sync Core";
        syncBtn.style.background = "white";
        toggleSettings();
    }, 800);
}

// 5. NEURAL EXECUTION ENGINE
async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDayMode = document.getElementById('mode-input').checked;
    const apiKey = localStorage.getItem('omni_k');

    if (files.filter(f => f).length < 1) return alert("OMNI: NO CHART DATA LINKED.");
    if (!apiKey) return alert("OMNI: HARDWARE LINK OFFLINE (API KEY MISSING).");

    btn.disabled = true;
    btn.innerText = "PROCESSING NEURAL LINK...";

    try {
        // Convert gallery images to Base64 for processing
        const dataBuffers = await Promise.all(files.map(f => f ? processImg(f) : Promise.resolve(null)));
        
        // Execute Google Generative AI Link
        const signal = await fetchNeuralSignal(apiKey, dataBuffers, isDayMode);
        
        renderTerminalOutput(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("OMNI ERROR: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

// 6. IMAGE PRE-PROCESSING (Anti-Taint Logic)
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

// 7. NEURAL API HANDLER
async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const strategy = isDay 
        ? "SURGICAL DAY (1H/15M). MIN RR 1:4.0+. Target Daily Bias & 15M MSS." 
        : "AGGRESSIVE SCALP (1M/15M). MIN RR 1:2.0+. Target Liquidity Sweeps.";

    const prompt = `[OMNI—DUAL CORE]
    MODE: ${strategy}
    FRAMEWORK: Institutional Smart Money Concepts.
    REQUIREMENT: Analyze attached charts. Locate Entry, SL, and TP.
    OUTPUT JSON: {"bias":"BUY|SELL|WATCHING", "ticker":"SYMBOL", "entry":number, "sl":number, "tp":number, "logic":"brief detail", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    if (!res.ok) throw new Error("API LINK REJECTED. CHECK KEY.");
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

// 8. UI RENDERING & LOT CALCULATION
function renderTerminalOutput(data) {
    const fmt = (v) => parseFloat(v).toFixed(4);
    const biasEl = document.getElementById('biasTxt');
    
    biasEl.innerText = data.bias;
    biasEl.className = `text-[120px] font-900 italic tracking-tighter leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = fmt(data.entry);
    document.getElementById('sVal').innerText = fmt(data.sl);
    document.getElementById('tVal').innerText = fmt(data.tp);

    // Calculate Dynamic Lot Size
    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat(localStorage.getItem('omni_b'));
    const riskPct = parseFloat(localStorage.getItem('omni_r'));
    
    if (balance && riskPct && riskAmt > 0) {
        const div = ASSET_CALC[data.type] || 1;
        const lotSize = ((balance * (riskPct / 100)) / (riskAmt * div));
        document.getElementById('lVal').innerText = lotSize.toFixed(4);
    }

    document.getElementById('logicLog').innerHTML = `
        <div class="flex justify-center gap-4 mb-8">
            <span class="bg-cyan-500/10 text-cyan-400 px-4 py-1 rounded-full text-[10px] font-black border border-cyan-500/20 uppercase">${data.ticker}</span>
            <span class="bg-white/5 text-white/30 px-4 py-1 rounded-full text-[10px] font-black border border-white/10 uppercase">${data.conf}/8 CONFIDENCE</span>
        </div>
        <p class="px-4 text-center">${data.logic}</p>
    `;
}
