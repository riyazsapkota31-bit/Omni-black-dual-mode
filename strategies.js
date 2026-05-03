/** * OMNI—DUAL | NEURAL CORE V62.6
 * STRATEGY: DUAL-CORE SMC/ICT 
 * MODEL: GEMINI-2.5-FLASH
 */

var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

// 1. GALLERY INJECTION LOGIC
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
        img.src = e.target.result;
        img.classList.remove('opacity-0');
        card.classList.add('active-box'); 
        icon.classList.add('hidden');
    };
    reader.readAsDataURL(f);
}

// 2. PERSISTENT CORE STORAGE
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
    syncBtn.style.color = "#000";
    
    setTimeout(() => {
        syncBtn.innerText = "Sync Core";
        syncBtn.style.background = "white";
        toggleSettings();
    }, 1000);
}

// 3. EXECUTION ENGINE
async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    if (files.filter(f => f).length < 1) return alert("OMNI: NO CHART DATA.");
    if (!key) return alert("OMNI: API KEY NOT FOUND.");

    btn.disabled = true;
    btn.innerText = "LINKING NEURAL CORE...";

    try {
        const dataBuffers = await Promise.all(files.map(f => f ? processImg(f) : Promise.resolve(null)));
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

// 4. IMAGE PRE-PROCESSING
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

// 5. NEURAL API HANDLER
async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `[OMNI—DUAL CORE] MODE: ${isDay ? "DAY (RR 1:4+)" : "SCALP (RR 1:2+)"}. ANALYZE FOR SMC/ICT DISPLACEMENT. JSON_ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"SYMBOL", "entry":number, "sl":number, "tp":number, "logic":"short_reasoning", "conf":1-8, "type":"CRYPTO|FOREX"}`;
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

// 6. UI RENDER & LOTS
function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic tracking-tighter leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat(localStorage.getItem('omni_b'));
    const riskPct = parseFloat(localStorage.getItem('omni_r'));
    
    if (balance && riskPct && riskAmt > 0) {
        const div = ASSET_CALC[data.type] || 1;
        document.getElementById('lVal').innerText = ((balance * (riskPct / 100)) / (riskAmt * div)).toFixed(4);
    }

    document.getElementById('logicLog').innerHTML = `<p class="text-center italic text-white/60 uppercase">${data.ticker} | ${data.conf}/8 CONF | ${data.logic}</p>`;
}
