/** * OMNI—BLACK V62.6 | SUPPORTED MODEL STABILITY
 * FIXED: 'Data already set' payload error & 'Neural Link' timeouts
 */
var files = [null, null, null, null];
const SPECS = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("Upload data to initiate link.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const key = localStorage.getItem('omni_kIn');
        if (!key) throw new Error("API Key Missing.");

        // Optimized compression: 900px at 0.5 quality keeps detail while preventing 
        // the "Neural Link Timeout" common on mobile networks
        const compressed = await Promise.all(files.map(f => f ? processImage(f) : Promise.resolve(null)));
        const signal = await fetchNeuralSignal(key, compressed, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        console.error("OMNI CRITICAL:", err);
        alert("SYSTEM ERROR: " + err.message); 
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
                const scale = 900 / Math.max(img.width, img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
        };
    });
}

async function fetchNeuralSignal(key, images, isDay) {
    // LOCKED TO SUPPORTED MODEL: gemini-2.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    // FIX: Building parts array as a fresh sequence to avoid 'data already set'
    const payloadParts = [];
    
    // Part [0]: System Instructions
    payloadParts.push({ 
        text: `[SYSTEM: OMNI-BLACK V62.6]
        MODE: ${isDay ? 'SURGICAL DAY TRADE' : 'AGGRESSIVE SCALP'}
        LOGIC: Institutional SMC/ICT. Analyze BOX 1-3 vs DXY in BOX 4.
        CONSTRAINTS: SCALP RR 1:2.1+ | DAY RR 1:4.0+.
        OUTPUT JSON ONLY: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "type":"CRYPTO|FOREX"}`
    });

    // Parts [1-4]: Images
    images.forEach(imgData => {
        if (imgData) {
            payloadParts.push({ 
                inline_data: { 
                    mime_type: "image/jpeg", 
                    data: imgData.split(',')[1] 
                } 
            });
        }
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: payloadParts }],
            generationConfig: { response_mime_type: "application/json", temperature: 0.1 }
        })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, "").trim());
}

function renderOutput(data, isDay) {
    const f = (v) => parseFloat(v).toFixed(4);
    const biasEl = document.getElementById('biasTxt');
    
    biasEl.innerText = data.bias || 'WATCHING';
    biasEl.className = `text-8xl font-black italic tracking-tighter leading-none ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = f(data.entry);
    document.getElementById('slVal').innerText = f(data.sl);
    document.getElementById('tpVal').innerText = f(data.tp);

    const rsk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const rwd = Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) || 0;
    const rr = rsk > 0 ? (rwd / rsk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-4">
            <span class="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black border border-cyan-500/20 uppercase tracking-widest">RR 1:${rr}</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase tracking-widest">${data.conf || 0}/8 CONF</span>
            <span class="bg-white/5 text-white/40 px-3 py-1 rounded-full text-[9px] font-black border border-white/10 uppercase tracking-widest">${data.ticker || 'NONE'}</span>
        </div>
        <p class="text-white/60 font-medium uppercase text-[11px] leading-relaxed tracking-tight italic">${data.logic}</p>
    `;

    // Account-based lot sizing logic
    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const riskPct = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && riskPct && rsk > 0) {
        const div = SPECS[data.type] || 1;
        document.getElementById('lotVal').innerText = ((bal * (riskPct / 100)) / (rsk * div)).toFixed(4);
    }
}

function setButtonState(b, d, t) { b.disabled = d; b.innerText = t; b.style.opacity = d ? "0.5" : "1"; }
