/** * OMNI—BLACK V62.6 | TIMEOUT FIX & INSTITUTIONAL RR LOCK 
 */
var files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("Upload charts to begin.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing.");

        // Aggressive Compression: 1000px max side at 0.6 quality to prevent timeouts
        const compressedImgs = await Promise.all(files.map(f => f ? compressAndEncode(f, 1000, 0.6) : Promise.resolve(null)));
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

async function compressAndEncode(file, maxDim, quality) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scale = maxDim / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const inlineData = images.map(data => data ? { inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } } : null).filter(Boolean);

    const prompt = `[SYSTEM: OMNI-BLACK V62.6 NEURAL TERMINAL]
    TASK: HIGH-RR STRUCTURAL ANALYSIS.
    MODE: ${isDay ? 'SURGICAL DAY TRADING' : 'AGGRESSIVE SCALPING'}.

    STRICT RISK RULES:
    1. SCALPING (1M/15M): MINIMUM RR 1:2.0+. Tight SL on 1M failure.
    2. DAY TRADING (1H/15M): MINIMUM RR 1:4.0 to 1:8.0+. SL behind 1H Swing Points.
    
    MANDATORY: 
    - Output levels ONLY for Target Asset (Boxes 1-3). 
    - Use DXY (Box 4) as optional confluence only.
    - If RR floor isn't met, return "WATCHING".

    RETURN JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "assetType":"CRYPTO|FOREX"}`;

    // Added AbortController for 30s manual timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });
    clearTimeout(id);

    const result = await response.json();
    if (!result.candidates?.[0]) throw new Error("Neural Link Timeout.");
    return JSON.parse(result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function renderOutput(data, isDay) {
    const num = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '--' : val.toFixed(2);
    };
    
    document.getElementById('biasTxt').innerText = data.bias || 'WATCHING';
    document.getElementById('biasTxt').className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = num(data.entry);
    document.getElementById('slVal').innerText = num(data.sl);
    document.getElementById('tpVal').innerText = num(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const reward = Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) || 0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.conf || 0}/8 CONF</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.ticker || 'N/A'}</span>
        </div>
        <p class="text-white/80 font-bold uppercase text-[11px] leading-tight">${data.logic || 'Analysing confluence...'}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const div = ASSET_SPECS[data.assetType || "CRYPTO"].lotDivisor;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
