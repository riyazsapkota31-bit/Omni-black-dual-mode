/** * OMNI—BLACK V62.6 | ABSOLUTE STABILITY BUILD
 */
var files = [null, null, null, null];
const ASSET_SPECS = { CRYPTO: { lotDivisor: 1 }, FOREX: { lotDivisor: 10 }, COMMODITY: { lotDivisor: 100 } };

async function executeSurgicalScan() {
    const btn = document.getElementById('goBtn');
    const out = document.getElementById('outPanel');
    const isDay = document.getElementById('mode-input').checked;
    
    const activeFiles = files.filter(f => f !== null);
    if (activeFiles.length < 1) return alert("Upload charts to begin.");
    
    setButtonState(btn, true, isDay ? "QUANT ANALYSING..." : "SCALP TRIGGERING...");

    try {
        const apiKey = localStorage.getItem('omni_kIn');
        if (!apiKey) throw new Error("API Key Missing. Store in localStorage 'omni_kIn'.");

        // Aggressive scale-down to 750px to prevent the "Neural Link Timeout"
        const compressedImgs = await Promise.all(files.map(f => f ? compressAndEncode(f, 750, 0.4) : Promise.resolve(null)));
        
        const signal = await fetchNeuralSignal(apiKey, compressedImgs, isDay);
        
        renderOutput(signal, isDay);
        out.classList.remove('hidden');
        out.scrollIntoView({ behavior: 'smooth' });
    } catch (err) { 
        console.error("OMNI CRITICAL:", err);
        alert("TERMINAL ERROR: " + err.message); 
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
    // Flash-Lite is 3x faster for processing image arrays
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`;
    
    // FIX: Sequentially build parts. Text PART first, then Image PARTS.
    const parts = [{ 
        text: `[SYSTEM: OMNI-BLACK V62.6]
        MODE: ${isDay ? 'SURGICAL DAY TRADING' : 'AGGRESSIVE SCALPING'}
        RR FLOOR: SCALP 1:2.0+ | DAY 1:4.0 to 1:8.0+
        
        TASK:
        1. Identify Target Ticker from IMAGES 1-3. 
        2. Filter signal using DXY (IMAGE 4) confluence.
        3. Only provide Entry/SL/TP if RR floor is met. Otherwise return bias: "WATCHING".
        
        RETURN JSON: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "assetType":"CRYPTO|FOREX"}`
    }];

    // Only append valid image data to prevent "Already Set" error
    images.forEach((imgData) => {
        if (imgData) {
            parts.push({ 
                inline_data: { 
                    mime_type: "image/jpeg", 
                    data: imgData.split(',')[1] 
                } 
            });
        }
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
    
    const rawText = result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(rawText);
}

function renderOutput(data, isDay) {
    const num = (v) => {
        const val = parseFloat(v);
        return isNaN(val) ? '--' : val.toFixed(4);
    };
    
    const biasEl = document.getElementById('biasTxt');
    biasEl.innerText = data.bias || 'WATCHING';
    biasEl.className = `text-8xl font-black italic tracking-tighter ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = num(data.entry);
    document.getElementById('slVal').innerText = num(data.sl);
    document.getElementById('tpVal').innerText = num(data.tp);

    const risk = Math.abs(parseFloat(data.entry) - parseFloat(data.sl)) || 0;
    const reward = Math.abs(parseFloat(data.tp) - parseFloat(data.entry)) || 0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '0.0';

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex gap-2 mb-3">
            <span class="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">RR 1:${rr}</span>
            <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">${data.conf || 0}/8 CONF</span>
            <span class="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">${data.ticker || 'N/A'}</span>
        </div>
        <p class="text-white/80 font-bold uppercase text-[11px] leading-tight">${data.logic || 'Analysis completed.'}</p>
    `;

    const bal = parseFloat(localStorage.getItem('omni_bIn')) || 0;
    const rsk = parseFloat(localStorage.getItem('omni_rIn')) || 0;
    if (bal && rsk && risk > 0) {
        const div = ASSET_SPECIFIC[data.assetType || "CRYPTO"].lotDivisor;
        document.getElementById('lotVal').innerText = ((bal * (rsk / 100)) / (risk * div)).toFixed(4);
    }
}

function setButtonState(btn, d, t) { btn.disabled = d; btn.innerText = t; btn.style.opacity = d ? "0.5" : "1"; }
