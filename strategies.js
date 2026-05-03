/** * OMNI—BLACK V62.6 | STRATEGIC HANDSHAKE
 * This script reads the HTML Switch and applies differentiated logic for Scalp vs Day.
 */
var files = [null, null, null, null];
const SPECS = { CRYPTO: { lotDiv: 1 }, FOREX: { lotDiv: 10 }, COMMODITY: { lotDiv: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');

    // 1. READ THE SWITCH STATE FROM HTML
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("Upload charts to continue.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing.");

        const compressed = await Promise.all(files.map(f => f ? compress(f, 850, 0.5) : Promise.resolve(null)));
        
        // 2. PASS SWITCH STATE TO NEURAL ENGINE
        const signal = await fetchNeuralSignal(apiKey, compressed, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden');
    } catch (err) { 
        console.error("OMNI CRITICAL:", err);
        alert("SYSTEM ERROR: " + err.message); 
    } finally { 
        setButtonState(btn, false, "Execute Neural Command"); 
    }
}

async function compress(file, max, qual) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const s = max / Math.max(img.width, img.height);
                canvas.width = img.width * s; canvas.height = img.height * s;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', qual)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    // 3. DIFFERENTIATED STRATEGY INJECTION BASED ON SWITCH
    const strategyContext = isDay 
        ? "SURGICAL DAY TRADING MODE: Focus on 1H structure shifts. RR floor is strictly 1:4.0 to 1:8.0+." 
        : "AGGRESSIVE SCALPING MODE: Focus on 1M liquidity sweeps and FVGs. RR floor is strictly 1:2.0+.";

    const parts = [{ 
        text: `[SYSTEM: OMNI-BLACK V62.6]
        ${strategyContext}
        
        SMC/ICT LOGIC: Prioritize Liquidity Sweeps, Market Displacement, and Fair Value Gaps.
        
        INSTRUCTIONS:
        1. Identify Asset Ticker from BOX 1-3. 
        2. Filter directional bias using DXY in BOX 4.
        3. Only provide entry/sl/tp if the mode's RR floor is strictly met.
        4. Return "WATCHING" if structure is low-confluence.
        
        JSON: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "assetType":"CRYPTO|FOREX"}`
    }];

    images.forEach(data => {
        if (data) parts.push({ inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } });
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: parts }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    
    return JSON.parse(result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function renderOutput(data, isDay) {
    const num = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '--' : val.toFixed(4);
    };
    
    const b = document.getElementById('biasTxt');
    b.innerText = data.bias || 'WATCHING';
    b.className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = num(data.entry);
    document.getElementById('slVal').innerText = num(data.sl);
    document.getElementById('tpVal').innerText = num(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const reward = Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) || 0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-4">
            <span class="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-cyan-500/20">RR 1:${rr}</span>
            <span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-500/20">${data.conf || 0}/8 CONF</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-white/10">${data.ticker || 'N/A'}</span>
        </div>
        <p class="text-white/70 font-bold uppercase text-[11px] leading-relaxed tracking-tight">${data.logic || 'Neural command complete.'}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && riskPct && risk > 0) {
        const div = SPECS[data.assetType || "CRYPTO"].lotDiv;
        document.getElementById('lotVal').innerText = ((bal * (riskPct / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
