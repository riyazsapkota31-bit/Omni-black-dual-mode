/** * OMNI—DUAL SOVEREIGN V74.5 
 * ENGINE: HIGH-PROBABILITY FILTRATION (80% / 95%)
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
        const active = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg transition-all";
        const inactive = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest text-white/20 hover:text-white/40 transition-all";
        s.className = m === 'scalp' ? active : inactive;
        d.className = m === 'day' ? active : inactive;
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`).files[0];
        if (file) {
            document.getElementById(`l${i}`).classList.add('hidden');
            document.getElementById(`ok${i}`).classList.remove('hidden');
            document.getElementById(`box${i}`).classList.add('active-ring');
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
                    const max = 1200; 
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > max) { h *= max / w; w = max; } }
                    else { if (h > max) { w *= max / h; h = max; } }
                    c.width = w; c.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', 0.8).split(',')[1]);
                };
            };
        });
    },

    ignite: async () => {
        const k = localStorage.getItem('ob_k'), b = localStorage.getItem('ob_b'), r = localStorage.getItem('ob_r');
        if (!k || !b || state.isSyncing) return ui.toggleSettings();

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        btn.innerText = "SYNCHRONIZING PROBABILITY...";

        // ULTRA-SPECIFIC MODE MANDATES
        const mandate = state.mode === 'scalp' 
            ? `MODE: HIGH-SPEED SCALPING (65-70% Prob Requirement). 
               TARGET: Quick M1 entries on M5 liquidity sweeps. 
               RR: 1:1.5 - 1:3. 
               FAILSAFE: If setup is <60% certain or choppy, return "WATCHING".`
            : `MODE: INSTITUTIONAL DAY TRADING (75-99% Prob Requirement). 
               TARGET: High-confluence H1 BOS + FVG retracements. 
               RR: 1:3.5 minimum. 
               FAILSAFE: Only trigger if setup is "Excellent/ A or A+". Otherwise return "WATCHING".`;

        const prompt = `ACT AS OMNI-DUAL SOVEREIGN CORE. 
            ACCOUNT: $${b} | RISK: ${r}%.
            ${mandate}

            CRITICAL DATA PARSING:
            1. Extract exact price numbers from the 4 charts provided.
            2. CALCULATE LOTS: ($${b} * (${r}/100)) / (Entry Price - StopLoss Price). Ensure decimals are correct for Asset class.
            3. WAIT SIGNAL: If "WATCHING", logic must describe the specific POI to wait for (max 15 words).

            MANDATE: RETURN RAW JSON ONLY.
            {"asset":"SYM","bias":"BUY/SELL/WATCHING","entry":"VAL","sl":"VAL","tp":"VAL","lots":"VAL","logic":"short explanation"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } }))
                        ]
                    }],
                    generationConfig: { temperature: 0.1, topP: 0.1 } // Forced precision
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawText = data.candidates[0].content.parts[0].text;
            const result = JSON.parse(rawText.replace(/```json|```/g, '').trim());

            const biasEl = document.getElementById('res-bias');
            biasEl.innerText = result.bias;
            
            const colors = { 'BUY': 'text-emerald-400', 'SELL': 'text-red-500', 'WATCHING': 'text-amber-400' };
            biasEl.className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${colors[result.bias] || 'text-white/20'}`;

            const isW = result.bias === 'WATCHING';
            document.getElementById('res-entry').innerText = isW ? "N/A" : result.entry;
            document.getElementById('res-sl').innerText = isW ? "N/A" : result.sl;
            document.getElementById('res-tp').innerText = isW ? "N/A" : result.tp;
            document.getElementById('res-lot').innerText = isW ? "N/A" : result.lots;
            document.getElementById('res-asset').innerText = result.asset;
            document.getElementById('res-logic').innerText = result.logic;
            
            document.getElementById('result-screen').classList.remove('hidden');

        } catch (err) {
            console.error("CORE ERROR:", err);
            alert("SYNC ERROR: Check API key or Image Clarity.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Execute Command";
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
