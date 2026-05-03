/**
 * OMNI—BLACK V62.6 | INSTANT NEURAL ENGINE
 */
var files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 2) return alert("Upload at least 2 charts.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing.");

        const b64Imgs = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        const signal = await fetchNeuralSignal(apiKey, b64Imgs, isDay);
        
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

async function fetchNeuralSignal(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    const prompt = `[SYSTEM: OMNI-BLACK V62.6]
    TASK: SINGLE-PASS ANALYSIS. MODE: ${isDay ? 'SURGICAL DAY' : 'AGGRESSIVE SCALP'}.
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

    // Removes potential markdown backticks that crash the parser
    let rawText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(rawText);
}

function renderOutput(data, isDay) {
    const num = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '--' : val.toFixed(4);
    };
    
    document.getElementById('biasTxt').innerText = data.bias;
    document.getElementById('biasTxt').className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = num(data.entry);
    document.getElementById('slVal').innerText = num(data.sl);
    document.getElementById('tpVal').innerText = num(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const rr = risk > 0 ? (Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase text-center">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase text-center">${data.conf}/8 CONF</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase text-center">${data.ticker}</span>
        </div>
        <p class="text-white/80 font-bold uppercase text-[11px] leading-tight">${data.logic}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const div = ASSET_SPECS[data.assetType || "CRYPTO"].lotDivisor;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
