/** * OMNI—DUAL | NEURAL CORE V62.6
 * MODEL: GEMINI-2.5-FLASH
 */
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    
    // Ensure all data frames are linked
    if (files.filter(f => f).length < 1) return alert("OMNI: LINK CHART DATA FIRST.");
    
    btn.disabled = true;
    btn.innerText = "LINKING CORE...";

    try {
        const key = localStorage.getItem('omni_k');
        if (!key) throw new Error("HARDWARE LINK FAILED: API KEY MISSING");

        const dataBuffers = await Promise.all(files.map(f => f ? processImg(f) : Promise.resolve(null)));
        const signal = await fetchSignal(key, dataBuffers, isDay);
        
        renderSignal(signal);
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

async function processImg(f) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                const s = 1000 / Math.max(img.width, img.height);
                cv.width = img.width * s; cv.height = img.height * s;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                resolve(cv.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

async function fetchSignal(key, imgs, isDay) {
    // LOCKED TO SUPPORTED GEMINI-2.5-FLASH
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    
    const prompt = `[CORE: OMNI-DUAL V62.6]
    STRATEGY: ${isDay ? "SURGICAL DAY (1H/15M). MIN RR 1:4.0+" : "AGGRESSIVE SCALP (1M/15M). MIN RR 1:2.0+"}
    FRAMEWORK: Institutional SMC/ICT. Focus on Liquidity Sweeps and Displacement.
    OUTPUT JSON: {"bias":"BUY|SELL|WATCHING", "ticker":"STR", "entry":number, "sl":number, "tp":number, "logic":"string", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { response_mime_type: "application/json", temperature: 0.1 } })
    });

    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function renderSignal(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic tracking-tighter leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    // Neural Lot Calculation
    const rsk = Math.abs(data.entry - data.sl);
    const bal = parseFloat(localStorage.getItem('omni_b'));
    const rkp = parseFloat(localStorage.getItem('omni_r'));
    
    if (bal && rkp && rsk > 0) {
        const div = ASSET_CALC[data.type] || 1;
        document.getElementById('lVal').innerText = ((bal * (rkp / 100)) / (rsk * div)).toFixed(4);
    }

    document.getElementById('logicLog').innerHTML = `
        <div class="flex justify-center gap-4 mb-8">
            <span class="bg-cyan-500/10 text-cyan-400 px-4 py-1 rounded-full text-[10px] font-black border border-cyan-500/20">${data.ticker}</span>
            <span class="bg-white/5 text-white/30 px-4 py-1 rounded-full text-[10px] font-black border border-white/10">${data.conf}/8 CONF</span>
        </div>
        ${data.logic}
    `;
}
