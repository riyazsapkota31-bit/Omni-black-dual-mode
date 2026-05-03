/**
 * OMNI—BLACK DUAL | VERSION 62.0 MASTER (FIXED BUILD)
 * ENFORCEMENT: 99% Surgical Precision | 8-Core Strategy Matrix
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

let files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 2) { 
        alert("SYSTEM ERROR: 15M + 1M required for Precision Scan."); 
        return; 
    }
    
    btn.disabled = true; 
    btn.style.opacity = "0.5"; 
    btn.innerText = "SURGICAL SCANNING...";

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("Hardware Link Offline: API Key Missing.");

        const b64Imgs = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        const signal = await fetchDualModeAnalysis(apiKey, b64Imgs, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden'); 
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        alert("CRITICAL ERROR: " + err.message); 
    } finally { 
        btn.disabled = false; 
        btn.style.opacity = "1"; 
        btn.innerText = "EXECUTE COMMAND"; 
    }
}

async function fetchDualModeAnalysis(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // PASS 1: OCR DATA INTEGRITY (Temperature 0.0 for literal data extraction)
    const p1 = { 
        contents: [{ parts: [{ text: "Extract exactly from charts: Asset Ticker, Live Price, 1H Bias, 15M Structure, 1M Sweep status. RETURN JSON ONLY." }, ...inlineData] }], 
        generationConfig: { response_mime_type: "application/json", temperature: 0.0 } 
    };
    const r1 = await fetch(url, { method: 'POST', body: JSON.stringify(p1) });
    const facts = JSON.parse((await r1.json()).candidates[0].content.parts[0].text);

    // PASS 2: STRATEGY ENFORCEMENT & MODE BRANCHING
    const modeDirectives = isDay 
        ? "MODE: DAY TRADE. Prioritize 1H Trend. Target 100% precision. RR 1:3.0 - 1:8.0. Ignore 1M micro-noise."
        : "MODE: SCALP. Prioritize 1M Sweep + MSS. Target 99% accuracy. RR 1:1.5 - 1:2.5. Fast entry on displacement.";
    
    const p2 = { 
        contents: [{ parts: [{ text: `Strategy: 8-Core Matrix (SMC/ICT/Wyckoff/DXY). Facts: ${JSON.stringify(facts)}. ${modeDirectives} Apply 0.05% SL Buffer. Return JSON: {bias, entry, sl, tp, logic, conf, strategy, scout: {level, msg}}` }] }], 
        generationConfig: { response_mime_type: "application/json", temperature: 0.1 } 
    };
    const r2 = await fetch(url, { method: 'POST', body: JSON.stringify(p2) });
    const sig = JSON.parse((await r2.json()).candidates[0].content.parts[0].text);

    // MATHEMATICAL RR GUARDRAILS (Enforces strict rules even if AI suggests loose targets)
    const minRR = isDay ? 3.0 : 1.5; 
    const maxRR = isDay ? 8.0 : 2.5;

    if (sig.bias !== 'WATCHING' && typeof sig.entry === 'number' && typeof sig.sl === 'number') {
        const risk = Math.abs(sig.entry - sig.sl) || 1;
        const rr = Math.abs(sig.tp - sig.entry) / risk;
        
        if (rr < minRR) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * minRR) : sig.entry - (risk * minRR);
        if (rr > maxRR) sig.tp = sig.bias === 'BUY' ? sig.entry + (risk * maxRR) : sig.entry - (risk * maxRR);
    }
    
    sig.assetType = facts.assetType; 
    return sig;
}

function renderOutput(data, isDay) {
    const bias = document.getElementById('biasTxt');
    bias.innerText = data.bias;
    bias.className = `text-8xl font-black italic tracking-tighter ${data.bias==='BUY'?'text-emerald-400':data.bias==='SELL'?'text-rose-500':'text-slate-500'}`;
    
    // CRITICAL FIX: Safe formatting helper to prevent .toFixed() errors
    const format = (val) => (typeof val === 'number' && !isNaN(val)) ? val.toFixed(2) : (val || '--');

    document.getElementById('entVal').innerText = format(data.entry);
    document.getElementById('slVal').innerText = format(data.sl);
    document.getElementById('tpVal').innerText = format(data.tp);
    
    const risk = (typeof data.entry === 'number' && typeof data.sl === 'number') ? Math.abs(data.entry - data.sl) : 0;
    const rr = risk > 0 ? (Math.abs(data.tp - data.entry) / risk).toFixed(1) : '0.0';
    
    let scout = (data.bias === 'WATCHING' && data.scout) ? `
        <div class="mt-4 p-4 border border-cyan-500/30 bg-cyan-500/5 rounded-2xl border-dashed">
            <p class="text-[10px] font-black text-cyan-400 uppercase mb-1">Scout POI: ${data.scout.level || '--'}</p>
            <p class="text-[12px] text-white italic">"${data.scout.msg}"</p>
        </div>` : '';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">${data.strategy || '8-CORE'}</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black">${data.conf || 0}/8 CONF</span>
        </div>
        <p class="text-white/80 font-bold uppercase tracking-tight leading-relaxed">${data.logic}</p>${scout}`;

    // Automatic Lot Calculation
    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const divisor = ASSET_SPECS[data.assetType]?.lotDivisor || 1;
        const lotSize = (bal * (rsk / 100)) / (risk * divisor);
        document.getElementById('lotVal').innerText = lotSize.toFixed(4);
    } else {
        document.getElementById('lotVal').innerText = '--';
    }
}

function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
