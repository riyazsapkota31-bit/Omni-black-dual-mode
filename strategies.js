/** * OMNI—BLACK V62.6 | INSTITUTIONAL RR LOCK 
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
    const inlineData = images.map(data => data ? { inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } } : null).filter(Boolean);

    // Prompt updated for your 1:2+ Scalping and 1:4-1:8+ Day Trading standards
    const prompt = `[SYSTEM: OMNI-BLACK V62.6 NEURAL TERMINAL]
    TASK: ANALYSE TARGET ASSET PIXELS FOR HIGH-RR SETUPS.
    
    MODE: ${isDay ? 'SURGICAL DAY TRADING' : 'AGGRESSIVE SCALPING'}.

    STRICT STRATEGIC RULES:
    1. IF AGGRESSIVE SCALPING (1M/15M):
       - RR FLOOR: 1:2.0. The engine must aim for 1:2.0 and above.
       - INVALIDATION: Stop Loss must be extremely tight, placed at the technical failure point of the 1M structure.
       - TARGET: Next high-probability liquidity sweep or structural retest.

    2. IF SURGICAL DAY TRADING (1H/15M):
       - RR FLOOR: 1:4.0. TARGET RANGE: 1:4.0 to 1:8.0+.
       - LOGIC: Must align with HTF institutional bias. Stop Loss must be placed behind 1H swing points.
       - TARGET: Major structural expansions or daily draws on liquidity.

    MANDATORY:
    - If market structure does NOT allow for the minimum RR (1:2 for Scalp, 1:4 for Day), return "WATCHING".
    - Entry, SL, and TP must be extracted from the Target Asset charts (Boxes 1-3).
    - DXY (Box 4) is for confluence ONLY. Never provide DXY levels.

    RETURN JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "assetType":"CRYPTO|FOREX"}`;

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
        <p class="text-white/80 font-bold uppercase text-[11px] leading-tight">${data.logic || 'Analysing structural confluence.'}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const div = ASSET_SPECS[data.assetType || "CRYPTO"].lotDivisor;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
