/** * OMNI—DUAL | NEURAL CORE V62.6
 * MODEL: GEMINI-2.5-FLASH
 * FEATURE: 4-CHART PRECISION + UI TICK MASKING
 */

var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

function injectGallery(i) { document.getElementById(`f${i}`).click(); }

function handleFile(i) {
    const f = document.getElementById(`f${i}`).files[0];
    if(!f) return;
    files[i] = f;

    // UI Tick Masking
    document.getElementById(`status${i}`).classList.add('hidden');
    document.getElementById(`tick${i}`).classList.remove('hidden');
    document.getElementById(`c${i}`).classList.add('active-box');
}

function toggleSettings() { document.getElementById('settingsPanel').classList.toggle('hidden'); }

function saveCore() {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;
    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);
    toggleSettings();
}

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    if (files.filter(f => f).length < 2) return alert("OMNI: LINK AT LEAST 2 CHARTS.");
    if (!key) return alert("OMNI: HARDWARE LINK OFFLINE.");

    btn.disabled = true;
    btn.innerText = "SQUASHING 4-CHART PAYLOAD...";

    try {
        // ANTI-REJECTION: Deep compression for 4 charts
        const dataBuffers = await Promise.all(files.map(f => f ? compressChart(f) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        
        const signal = await fetchNeuralSignal(key, dataBuffers, isDay);
        displayOutput(signal);
        
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("CRITICAL ERROR: API REJECTED. REDUCE CHART COMPLEXITY.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

// SURGICAL COMPRESSION
async function compressChart(f) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                // 512px limit ensures 4 charts fit in a single prompt payload
                const maxDim = 512; 
                const scale = maxDim / Math.max(img.width, img.height);
                cv.width = img.width * scale; cv.height = img.height * scale;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                resolve(cv.toDataURL('image/jpeg', 0.35));
            };
        };
    });
}

async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = isDay ? "SURGICAL DAY (1H/15M)" : "AGGRESSIVE SCALP (1M/15M)";

    const prompt = `[OMNI—V6]
    MODE: ${mode}
    STRATEGY: SMC/ICT (Liquidity/Displacement).
    JSON: {"bias":"BUY|SELL", "ticker":"SYM", "entry":number, "sl":number, "tp":number, "logic":"short", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: parts }], 
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 } 
        })
    });

    if (!res.ok) throw new Error("REJECTED");
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
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
    document.getElementById('logicLog').innerText = `${data.ticker} | ${data.conf}/8 CONF | ${data.logic}`;
}
