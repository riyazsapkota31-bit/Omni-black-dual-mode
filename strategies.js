/** * OMNI—BLACK SOVEREIGN V73.0 
 * FEATURES: SURGICAL COMPRESSION + 15-WORD LOGIC MANDATE 
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
        const active = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg";
        const inactive = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest text-white/20";
        s.className = m === 'scalp' ? active : inactive;
        d.className = m === 'day' ? active : inactive;
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`).files[0];
        if (file) {
            document.getElementById(`l${i}`).classList.add('hidden');
            document.getElementById(`ok${i}`).classList.remove('hidden');
            document.getElementById(`box${i}`).classList.add('active-ring');
            // COMPRESSION: Vital for preventing "ENGINE TIMEOUT"
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
                    const ctx = c.getContext('2d');
                    const max = 1024;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > max) { h *= max / w; w = max; } }
                    else { if (h > max) { w *= max / h; h = max; } }
                    c.width = w; c.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', 0.6).split(',')[1]);
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

        // STRICT MANDATE: Forcing 15-word logic limit for surgical output
        const prompt = `ACT AS OMNI-BLACK CORE. MODE: ${state.mode.toUpperCase()}. CAPITAL: $${b} RISK: ${r}%. 
            Analyze 4-chart confluence for SMC/ICT. 
            STRICT MANDATE: 'logic' field MUST NOT exceed 15 words. 
            JSON ONLY: {"asset":"SYM","bias":"BUY/SELL/WATCHING","entry":"VAL","sl":"VAL","tp":"VAL","lots":"VAL","logic":"15-word max logic"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } }))
                        ]
                    }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const result = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));

            const biasEl = document.getElementById('res-bias');
            biasEl.innerText = result.bias;
            
            // Dynamic UI colors for BUY/SELL/WATCHING
            biasEl.className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${
                result.bias === 'BUY' ? 'text-emerald-400' : result.bias === 'SELL' ? 'text-red-500' : 'text-white/20'
            }`;

            document.getElementById('res-entry').innerText = result.entry;
            document.getElementById('res-sl').innerText = result.sl;
            document.getElementById('res-tp').innerText = result.tp;
            document.getElementById('res-lot').innerText = result.lots;
            document.getElementById('res-asset').innerText = result.asset;
            document.getElementById('res-logic').innerText = result.logic;
            
            document.getElementById('result-screen').classList.remove('hidden');

        } catch (err) {
            console.error(err);
            alert("SYNC ERROR: Check API Key or Network Quality"); //
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
    }
};
