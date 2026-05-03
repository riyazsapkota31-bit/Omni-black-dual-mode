
let files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 2) { alert("ERROR: Upload 15M + 1M charts."); return; }
    
    btn.disabled = true; btn.innerText = "SURGICAL SCANNING...";
    try {
        const apiKey = localStorage.getItem('omni_kIn');
        const b64Imgs = await Promise.all(files.map(f => f ? toBase64(f) : Promise.resolve(null)));
        const signal = await fetchDualModeAnalysis(apiKey, b64Imgs, isDay);
        renderOutput(signal, isDay);
        out.classList.remove('hidden'); out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { alert("SYSTEM CRITICAL: " + err.message); }
    finally { btn.disabled = false; btn.innerText = "EXECUTE COMMAND"; }
}

async function fetchDualModeAnalysis(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const inlineData = images.filter(Boolean).map(b => ({ inline_data: { mime_type: "image/jpeg", data: b.split(',')[1] } }));

    // PASS 1: RAW DATA EXTRACTION (0.0 TEMPERATURE FOR 100% ACCURACY)
    const p1 = { contents: [{ parts: [{ text: "Extract: Asset Ticker, Live Price, 1H Bias, 15M OB level, 1M Sweep status. JSON ONLY." }, ...inlineData] }], generationConfig: { response_mime_type: "application/json", temperature: 0.0 } };
    const r1 = await fetch(url, { method: 'POST', body: JSON.stringify(p1) });
    const facts = JSON.parse((await r1.json()).candidates[0].content.parts[0].text);

    // PASS 2: STRATEGY ENFORCEMENT
    const modePrompt = isDay 
        ? "MODE: DAY TRADE. Focus on 1H structural bias. 100% precision. RR 1:3.0 to 1:8.0. Ignore 1M noise."
        : "MODE: SCALP. Focus on 1M/5M liquidity sweeps + displacement. 99% accuracy. RR 1:1.5 to 1:2.5. Fast entry/exit.";
    
    const p2 = { contents: [{ parts: [{ text: `Strategy: SMC/ICT. Facts: ${JSON.stringify(facts)}. ${modePrompt} Return JSON: {bias, entry, sl, tp, logic, conf, strategy}` }] }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } };
    const r2 = await fetch(url, { method: 'POST', body: JSON.stringify(p2) });
    return JSON.parse((await r2.json()).candidates[0].content.parts[0].text);
}

function renderOutput(data, isDay) {
    const bias = document.getElementById('biasTxt');
    bias.innerText = data.bias;
    bias.className = `text-8xl font-black italic tracking-tighter ${data.bias==='BUY'?'text-emerald-400':data.bias==='SELL'?'text-rose-500':'text-slate-500'}`;
    
    document.getElementById('entVal').innerText = data.entry.toFixed(2);
    document.getElementById('slVal').innerText = data.sl.toFixed(2);
    document.getElementById('tpVal').innerText = data.tp.toFixed(2);
    
    const risk = Math.abs(data.entry - data.sl);
    const rr = (Math.abs(data.tp - data.entry) / (risk || 1)).toFixed(1);
    
    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-2">
            <span class="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-lg">${data.strategy}</span>
            <span class="bg-white/10 px-2 py-1 rounded-lg">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">${data.conf}/8 CONF</span>
        </div>
        <p>${data.logic}</p>`;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk) document.getElementById('lotVal').innerText = ((bal * (rsk/100)) / (risk || 1)).toFixed(4);
}

function toBase64(f) { return new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }); }
