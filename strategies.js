/** * OMNI—BLACK V62.6 | NEURAL STRATEGY ENGINE
 * RESTORED: Precision SMC/ICT Logic & High-Speed Image Processing
 */
var files = [null, null, null, null];
const SPECS = { CRYPTO: { div: 1 }, FOREX: { div: 10 }, COMMODITY: { div: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    
    // 1. READ MODE FROM HTML SWITCH
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("System requires chart data to initiate scan.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key missing in LocalStorage.");

        // Speed Optimization: Compression ensures 99% precision without data-bloat
        const compressed = await Promise.all(files.map(f => f ? processImage(f) : Promise.resolve(null)));
        
        // 2. FETCH NEURAL SIGNAL
        const signal = await fetchNeuralSignal(apiKey, compressed, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        console.error("NEURAL ERROR:", err);
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
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    // RESTORED: Gemini 2.5 Flash API Core
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    // 3. DUAL-STRATEGY CONDITION INJECTION
    const strategy = isDay 
        ? "SURGICAL DAY TRADE: Focus on 1H/15M Structure Shifts. RR LOCK: 1:4.0 to 1:8.0+." 
        : "AGGRESSIVE SCALP: Focus on 1M/15M Liquidity Sweeps & FVG. RR LOCK: 1:2.1+.";

    const promptParts = [{ 
        text: `[OMNI-BLACK V62.6] 
        MODE: ${strategy}
        LOGIC: Institutional SMC/ICT. Analyze BOX 1-3 vs DXY in BOX 4.
        
        REQUIREMENTS:
        1. Identify ticker from visuals. 
        2. Correlate directional bias with DXY. 
        3. Issue BUY/SELL ONLY if an institutional sweep is identified and RR floor is met.
        4. If low confluence, return bias "WATCHING".
        
        OUTPUT JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "type":"CRYPTO|FOREX"}`
    }];

    images.forEach(data => {
        if (data) promptParts.push({ 
            inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } 
        });
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: promptParts }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const res = await response.json();
    if (res.error) throw new Error(res.error.message);
    
    const raw = res.candidates[0].content.parts[0].text;
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function renderOutput(data, isDay) {
    const format = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '0.0000' : val.toFixed(4);
    };
    
    const biasEl = document.getElementById('biasTxt');
    biasEl.innerText = data.bias || 'WATCHING';
    biasEl.className = `text-8xl font-black italic tracking-tighter leading-none ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = format(data.entry);
    document.getElementById('slVal').innerText = format(data.sl);
    document.getElementById('tpVal').innerText = format(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const reward = Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) || 0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-4">
            <span class="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black border border-cyan-500/20 uppercase">RR 1:${rr}</span>
            <span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-500/20 uppercase">${data.conf}/8 CONF</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase">${data.ticker}</span>
        </div>
        <p class="text-white/70 font-bold uppercase text-[11px] leading-relaxed tracking-tight italic">${data.logic}</p>
    `;

    // 4. RISK MANAGEMENT CALCULATION
    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && riskPct && risk > 0) {
        const div = SPECS[data.type || "CRYPTO"].div;
        document.getElementById('lotVal').innerText = ((bal * (riskPct / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { 
    btn.disabled = d; 
    btn.innerText = t; 
    btn.style.opacity = d ? "0.5" : "1"; 
}
