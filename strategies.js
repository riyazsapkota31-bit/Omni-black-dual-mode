/** * OMNI—DUAL | NEURAL CORE V62.6
 * STRATEGY: DUAL-CORE SMC/ICT
 * MODEL: GEMINI-2.5-FLASH
 */
const ASSETS = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDayMode = document.getElementById('mode-input').checked;
    
    if (files.filter(f => f).length < 1) return alert("OMNI: NO DATA LINKED.");
    
    btn.disabled = true;
    btn.innerText = isDayMode ? "QUANT ANALYSING..." : "SCALP TRIGGERING...";

    try {
        const key = localStorage.getItem('omni_kIn');
        if (!key) throw new Error("HARDWARE LINK FAILED: KEY MISSING");

        // High-Precision Processing
        const neuralData = await Promise.all(files.map(f => f ? processBuffer(f) : Promise.resolve(null)));
        const signal = await connectNeuralLink(key, neuralData, isDayMode);
        
        displaySignal(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

async function processBuffer(f) {
    return new Promise((res) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                const scale = 1000 / Math.max(img.width, img.height);
                cv.width = img.width * scale; cv.height = img.height * scale;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                res(cv.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

async function connectNeuralLink(key, imgs, isDay) {
    // LOCKED TO SUPPORTED MODEL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    // STRICT RR LOGIC INJECTION
    const promptParts = [{ text: `[CORE: OMNI-DUAL V62.6]
    SELECTED STRATEGY: ${isDay ? "SURGICAL DAY (1H/15M). MIN RR 1:4.0+" : "AGGRESSIVE SCALP (1M/15M). MIN RR 1:2.0+"}
    FRAMEWORK: Institutional SMC. Target Market Structure Shifts, Liquidity Sweeps, and FVGs.
    OUTPUT FORMAT: JSON ONLY. 
    SCHEMA: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "type":"CRYPTO|FOREX"}` }];

    imgs.forEach(data => { if (data) promptParts.push({ inline_data: { mime_type: "image/jpeg", data: data.split(',')[1] } }); });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: promptParts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return JSON.parse(result.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function displaySignal(data) {
    const format = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    
    b.innerText = data.bias;
    b.className = `text-[130px] font-900 italic tracking-tighter leading-none mb-6 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('entVal').innerText = format(data.entry);
    document.getElementById('slVal').innerText = format(data.sl);
    document.getElementById('tpVal').innerText = format(data.tp);

    // Neural Lot Size Calculation
    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat(localStorage.getItem('omni_bIn'));
    const riskPct = parseFloat(localStorage.getItem('omni_rIn'));
    
    if (balance && riskPct && riskAmt > 0) {
        const divisor = ASSETS[data.type] || 1;
        document.getElementById('lotVal').innerText = ((balance * (riskPct / 100)) / (riskAmt * divisor)).toFixed(4);
    }

    document.getElementById('logicSummary').innerHTML = `
        <div class="flex justify-center gap-4 mb-8">
            <span class="bg-cyan-500/10 text-cyan-400 px-5 py-2 rounded-full text-[10px] font-black border border-cyan-500/20 uppercase tracking-widest">${data.ticker}</span>
            <span class="bg-white/5 text-white/40 px-5 py-2 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest">${data.conf}/8 CONF</span>
        </div>
        <p class="px-4">${data.logic}</p>
    `;
}
