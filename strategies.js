/** * OMNI—DUAL V62.6 | STRATEGIC PRECISION
 * FIX: Payload Sequencing & Risk Calculations
 */
const ASSET_TYPES = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("System requires chart data.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const key = localStorage.getItem('omni_kIn');
        if (!key) throw new Error("Configure API Key in Settings.");

        // Accuracy-Preserving Compression
        const compressed = await Promise.all(files.map(f => f ? processImage(f) : Promise.resolve(null)));
        const signal = await fetchNeuralSignal(key, compressed, isDay);
        
        renderOutput(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert("CRITICAL ERROR: " + err.message);
    } finally {
        setButtonState(btn, false, "Execute Neural Command");
    }
}

async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scale = 950 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    // Model selection based on user compatibility report
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    // FIX: Building parts array strictly as a sequence to prevent 'already set' error
    const promptParts = [{ text: `[SYSTEM: OMNI-BLACK]
    MODE: ${isDay ? "SURGICAL DAY (1H Structure)" : "AGGRESSIVE SCALP (1M Sweep)"}
    LOGIC: Institutional SMC/ICT. Analyze BOX 1-3 against DXY in BOX 4.
    OUTPUT JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "type":"CRYPTO|FOREX"}` }];

    images.forEach(data => {
        if (data) promptParts.push({ inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } });
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: promptParts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    const rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

function renderOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    b.innerText = data.bias;
    b.className = `text-8xl font-900 italic tracking-tighter leading-none mb-2 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = f(data.entry);
    document.getElementById('slVal').innerText = f(data.sl);
    document.getElementById('tpVal').innerText = f(data.tp);

    const rsk = Math.abs(data.entry - data.sl);
    const rwd = Math.abs(data.tp - data.entry);
    const rr = rsk > 0 ? (rwd / rsk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-3 mb-5">
            <span class="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black border border-cyan-500/20 uppercase tracking-widest">RR 1:${rr}</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase tracking-widest">${data.conf}/8 CONF</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase tracking-widest">${data.ticker}</span>
        </div>
        ${data.logic}
    `;

    // Account Balance/Risk Logic
    const bal = parseFloat(localStorage.getItem('omni_bIn'));
    const pct = parseFloat(localStorage.getItem('omni_rIn'));
    if (bal && pct && rsk > 0) {
        const div = ASSET_TYPES[data.type] || 1;
        document.getElementById('lotVal').innerText = ((bal * (pct / 100)) / (rsk * div)).toFixed(4);
    }
}

function setButtonState(b, d, t) { b.disabled = d; b.innerText = t; b.style.opacity = d ? "0.5" : "1"; }
