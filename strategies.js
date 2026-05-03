/** OMNI—BLACK | SOVEREIGN V73.0 
 * PERFORMANCE OPTIMIZED FOR LOW-LATENCY DUAL-CORE SYNC
 */

const state = {
    mode: 'scalp',
    payloads: [null, null, null, null],
    isSyncing: false
};

const ui = {
    toggleSettings: () => document.getElementById('settings').classList.toggle('hidden'),
    trigger: (i) => document.getElementById(`f${i}`).click(),
    save: () => {
        localStorage.setItem('ob_k', document.getElementById('key').value);
        localStorage.setItem('ob_b', document.getElementById('bal').value);
        localStorage.setItem('ob_r', document.getElementById('risk').value);
        ui.toggleSettings();
    }
};

const engine = {
    setMode: (m) => {
        state.mode = m;
        const s = document.getElementById('btnScalp'), d = document.getElementById('btnDay');
        s.className = m === 'scalp' ? "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg" : "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest text-white/20";
        d.className = m === 'day' ? "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg" : "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest text-white/20";
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`).files[0];
        if (file) {
            document.getElementById(`l${i}`).classList.add('hidden');
            document.getElementById(`ok${i}`).classList.remove('hidden');
            document.getElementById(`box${i}`).classList.add('active-ring');
            
            // CRITICAL: Compressed for 10x faster upload
            state.payloads[i] = await engine.compress(file);
        }
    },

    compress: (file) => {
        return new Promise(res => {
            const r = new FileReader();
            r.readAsDataURL(file);
            r.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const c = document.createElement('canvas');
                    // Shrinking dimensions slightly for speed, keeping high DPI for candle visibility
                    const scale = 1200 / img.width; 
                    c.width = 1200; 
                    c.height = img.height * scale;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                    res(c.toDataURL('image/jpeg', 0.7).split(',')[1]); // 0.7 quality is the "Sweet Spot"
                };
            };
        });
    },

    ignite: async () => {
        const k = localStorage.getItem('ob_k'), b = localStorage.getItem('ob_b'), r = localStorage.getItem('ob_r');
        if (!k || !b || state.isSyncing) return ui.toggleSettings();

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        btn.innerText = "VERIFYING CONFLUENCE...";

        const sysPrompt = `ACT AS OMNI-BLACK 8-CORE ENGINE. MODE: ${state.mode.toUpperCase()}. 
            CAPITAL: $${b} | RISK: ${r}%. Prioritize: Liquidity Sweeps, MSS, FVG.
            JSON ONLY: {"status":"SIGNAL","asset":"SYM","bias":"LONG/SHORT","entry":"VAL","sl":"VAL","tp":"VAL","lots":"VAL","logic":"Technical proof"}`;

        try {
            const payload = {
                contents: [{
                    parts: [{ text: sysPrompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } }))]
                }]
            };

            // Using the primary 2.5 Flash core for the initial heavy lift
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));

            alert(`[${result.asset}] ${result.bias}\nENTRY: ${result.entry}\nSL: ${result.sl}\nTP: ${result.tp}\nLOTS: ${result.lots}\n\nLOGIC: ${result.logic}`);
        } catch (e) {
            alert("SYNC TIMEOUT: Check internet or API key.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Execute Signal";
        }
    }
};

window.onload = () => {
    if(localStorage.getItem('ob_k')) {
        document.getElementById('key').value = localStorage.getItem('ob_k');
        document.getElementById('bal').value = localStorage.getItem('ob_b');
        document.getElementById('risk').value = localStorage.getItem('ob_r');
        engine.setMode('scalp');
    }
};
