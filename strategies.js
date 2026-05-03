/** * OMNI—BLACK V62.6 | SMART CORRELATION & OPTIONAL DXY PATCH
 */
var files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    // Only boxes 0, 1, and 2 (Target Asset) are strictly checked for the minimum 2-chart rule
    const targetCharts = [files[0], files[1], files[2]].filter(f => f).length;
    if (targetCharts < 1) return alert("Upload at least the 15M or 1M chart of your Target Asset.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing.");

        const compressedImgs = await Promise.all(files.map(f => f ? compressAndEncode(f) : Promise.resolve(null)));
        const signal = await fetchNeuralSignal(apiKey, compressedImgs, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        console.error(err);
        alert("CRITICAL ERROR: " + err.message); 
    } finally { 
        setButtonState(btn, false, "EXECUTE COMMAND"); 
    }
}

async function compressAndEncode(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scale = 1200 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const inlineData = images.map((data, index) => {
        if (!data) return null;
        return { inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } };
    }).filter(Boolean);

    // Prompt updated: DXY is now OPTIONAL and never the tradeable asset
    const prompt = `[SYSTEM: OMNI-BLACK V62.6 NEURAL TERMINAL]
    TASK: ANALYSE TARGET ASSET PIXELS.
    
    1. TARGET IDENTIFICATION: Boxes 1-3 contain the TARGET ASSET (e.g. BTC, SOL). 
    2. OPTIONAL DXY: Box 4 may contain DXY. If present, use it ONLY to confirm directional bias for the Target Asset (DXY Strength = Target Asset Weakness). 
    3. ZERO DXY TRADING: Never provide Entry/SL/TP for DXY. All price levels MUST come from the Target Asset charts.
    4. FALLBACK: If Box 4 is empty, ignore DXY correlation and provide a pure Technical Analysis setup for the Target Asset.
    
    MODE: ${isDay ? 'SURGICAL DAY' : 'AGGRESSIVE SCALP'}.
    RETURN JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"TARGET_TICKER", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "assetType":"CRYPTO|FOREX"}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const result = await response.json();
    if (!result.candidates?.[0]) throw new Error("Neural Link Timeout.");

    let rawText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(rawText);
}

function renderOutput(data, isDay) {
    const num = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '--' : val.toFixed(4);
    };
    
    document.getElementById('biasTxt').innerText = data.bias || 'WATCHING';
    document.getElementById('biasTxt').className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = num(data.entry);
    document.getElementById('slVal').innerText = num(data.sl);
    document.getElementById('tpVal').innerText = num(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const rr = risk > 0 ? (Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.conf || 0}/8 CONF</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.ticker || 'N/A'}</span>
        </div>
        <p class="text-white/80 font-bold uppercase text-[11px] leading-tight">${data.logic || 'Waiting for structural alignment.'}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const div = ASSET_SPECS[data.assetType || "CRYPTO"].lotDivisor;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
