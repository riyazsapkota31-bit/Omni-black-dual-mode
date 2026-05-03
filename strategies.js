/**
 * OMNI—BLACK DUAL | VERSION 62.3 ULTRA
 * ENGINE: MULTI-MODEL GEMINI 2.5 (Flash & Flash-Lite)
 */

let files = [null, null, null, null];
const ASSET_SPECS = { 
    CRYPTO: { lotDivisor: 1 }, 
    FOREX: { lotDivisor: 10 }, 
    COMMODITY: { lotDivisor: 100 } 
};

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 2) { 
        alert("PRECISION ERROR: 15M Structure + 1M Trigger required."); 
        return; 
    }
    
    setButtonState(btn, true, isDay ? "SYNCHRONIZING 2.5 FLASH..." : "SCANNING 2.5 LITE...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("Hardware Link Offline: API Key Missing.");

        const b64Imgs = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        const signal = await fetchDualModeAnalysis(apiKey, b64Imgs, isDay);
        
        if (signal) {
            renderOutput(signal, isDay);
            out.classList.remove('hidden');
            out.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) { 
        alert("CRITICAL ERROR: " + err.message); 
    } finally { 
        setButtonState(btn, false, "EXECUTE COMMAND"); 
    }
}

async function fetchDualModeAnalysis(key, images, isDay) {
    // Dynamically selects Gemini 2.5 Flash for Day Trading and Flash-Lite for Scalping speed
    const model = isDay ? "gemini-2.5-flash" : "gemini-2.5-flash-lite"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    
    const inlineData = images.filter(Boolean).map(b => ({ 
        inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } 
    }));

    const surgicalPrompt = `ACT AS OMNI-BLACK V62.3.
    STRATEGY: ${isDay ? 'Surgical Day Trade' : 'Aggressive Scalp'}.
    1. Extract Asset, Price, and Bias.
    2. Apply 8-Core Matrix (SMC, ICT, Wyckoff).
    3. Return JSON ONLY: {"bias":"BUY|SELL|WATCHING", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":number, "assetType":"CRYPTO|FOREX", "ticker":"string"}`;

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            contents: [{ parts: [{ text: surgicalPrompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const result = await response.json();

    // SAFETY GUARD: Prevents the "reading '0'" error from empty API responses
    if (!result.candidates || !result.candidates[0]) {
        throw new Error(`Model ${model} timed out. Please retry.`);
    }

    let sig = JSON.parse(result.candidates[0].content.parts[0].text);

    // QUANT ENFORCEMENT: Enforces RR based on mode
    const minRR = isDay ? 3.0 : 1.5;
    if (sig.bias !== 'WATCHING' && typeof sig.entry === 'number') {
        const risk = Math.abs(sig.entry - sig.sl) || 0.0001;
        if ((Math.abs(sig.tp - sig.entry) / risk) < minRR) {
            sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * minRR) : sig.entry - (risk * minRR);
        }
    }
    return sig;
}

function renderOutput(data, isDay) {
    const format = (val) => (typeof val === 'number') ? val.toFixed(2) : '--';
    
    document.getElementById('biasTxt').innerText = data.bias;
    document.getElementById('biasTxt').className = `text-8xl font-black italic tracking-tighter ${
        data.bias === 'BUY' ? 'text-emerald-400' : data.bias === 'SELL' ? 'text-rose-500' : 'text-slate-500'
    }`;

    document.getElementById('entVal').innerText = format(data.entry);
    document.getElementById('slVal').innerText = format(data.sl);
    document.getElementById('tpVal').innerText = format(data.tp);

    const risk = Math.abs(data.entry - data.sl) || 0;
    const rr = risk > 0 ? (Math.abs(data.tp - data.entry) / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black">${data.conf}/8 CONF</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black">${data.ticker || 'ASSET'}</span>
        </div>
        <p class="text-white/80 font-bold uppercase tracking-tight">${data.logic}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const divisor = ASSET_SPECS[data.assetType]?.lotDivisor || 1;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * divisor)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { if(btn) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; } }
function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
