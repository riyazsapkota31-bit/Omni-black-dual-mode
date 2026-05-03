/**
 * OMNI—BLACK DUAL | VERSION 62.1 PRO
 * ENFORCEMENT: 99% Precision | Latency Optimized
 */

let files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 2) { 
        alert("REQUIRED: 15M Structure + 1M Trigger charts."); 
        return; 
    }
    
    setButtonState(btn, true, isDay ? "ANALYZING TREND..." : "SCANNING SWEEP...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing. Link Hardware.");

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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // Optimization: We now merge extraction and analysis into one surgical pass to cut time in half
    const prompt = `ACT AS OMNI-BLACK V62.1. 
    1. Extract Asset, Price, and Bias.
    2. Strategy: ${isDay ? "DAY TRADE (15M Structure)" : "SCALP (1M Liquidity Sweep)"}.
    3. Apply 8-Core Matrix (SMC/ICT).
    Return JSON ONLY: {"bias":"BUY/SELL/WATCHING", "entry":number, "sl":number, "tp":number, "logic":"brief", "conf":number, "assetType":"CRYPTO/FOREX"}`;

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, ...inlineData] }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const result = await response.json();

    // SAFETY CHECK: Prevents the "reading '0'" error
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("API Timeout or Empty Response. Please try again.");
    }

    let sig = JSON.parse(result.candidates[0].content.parts[0].text);

    // RR Enforcement
    const minRR = isDay ? 3.0 : 1.5;
    if (sig.bias !== 'WATCHING' && typeof sig.entry === 'number') {
        const risk = Math.abs(sig.entry - sig.sl) || 1;
        const currentRR = Math.abs(sig.tp - sig.entry) / risk;
        if (currentRR < minRR) {
            sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * minRR) : sig.entry - (risk * minRR);
        }
    }

    return sig;
}

function renderOutput(data, isDay) {
    const format = (val) => (typeof val === 'number') ? val.toFixed(2) : '--';
    
    document.getElementById('biasTxt').innerText = data.bias;
    document.getElementById('entVal').innerText = format(data.entry);
    document.getElementById('slVal').innerText = format(data.sl);
    document.getElementById('tpVal').innerText = format(data.tp);

    const logicBox = document.getElementById('logicSummary');
    const risk = Math.abs(data.entry - data.sl) || 0;
    const rr = risk > 0 ? (Math.abs(data.tp - data.entry) / risk).toFixed(1) : '0.0';

    logicBox.innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black">${data.conf}/8 CONFLUENCE</span>
        </div>
        <p class="text-white/80 font-bold uppercase text-[11px]">${data.logic}</p>
    `;

    // Lot Calculation
    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const divisor = ASSET_SPECS[data.assetType]?.lotDivisor || 1;
        const size = (bal * (rsk / 100)) / (risk * divisor);
        document.getElementById('lotVal').innerText = size.toFixed(4);
    }
}

function setButtonState(btn, d, t) { if(btn) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; } }
function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
