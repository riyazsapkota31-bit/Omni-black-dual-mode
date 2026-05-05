/** * OMNI—DUAL SOVEREIGN V75.0 
 * REQ: HIGH-PROBABILITY FILTRATION & NULL-SHIELD
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
                    const max = 1400; // Enhanced for OCR accuracy
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
        btn.innerText = "PARSING INSTITUTIONAL DATA...";

        // MODE-SPECIFIC PROBABILITY GATES
        const strategyPersona = state.mode === 'scalp' 
            ? `[MODE: SCALPER - 65-99% PROBABILITY]
               Focus: Quick M1 reaction to M5 liquidity sweeps. 
               Risk: Lowest possible SL. 
               Failsafe: If setup is <60% or ranging, BIAS must be "WATCHING".`
            : `[MODE: DAY TRADER - 85-99% PROBABILITY]
               Focus: A+ Setups only. H1 BOS + FVG retracement. 
               Requirement: High-confluence institutional footprint. 
               Failsafe: If setup is not "Excellent/A or A+", BIAS must be "WATCHING".`;

        const prompt = `ACT AS OMNI-DUAL SOVEREIGN ENGINE. 
            ACCOUNT: $${b} | RISK: ${r}%.
            ${strategyPersona}

            DATA TASK:
            1. Scrape price data from charts.
            2. CALCULATE LOTS: ($${b} * (${r}/100)) / (Entry - SL price distance).
            3. If BIAS is "WATCHING", 'logic' must state the wait-level (POI) in 10-15 words.

            STRICT JSON OUTPUT ONLY:
            {"asset":"SYM","bias":"BUY/SELL/WATCHING","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","logic":"..."}`;

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
                    generationConfig: { temperature: 0.1, topP: 0.1 }
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const rawText = data.candidates[0].content.parts[0].text;
            const result = JSON.parse(rawText.replace(/```json|```/g, '').trim());

            // UI UPDATES WITH NULL-SHIELD
            const biasEl = document.getElementById('res-bias');
            biasEl.innerText = result.bias || "WATCHING";
            
            const colorMap = { 'BUY': 'text-emerald-400', 'SELL': 'text-red-500', 'WATCHING': 'text-amber-400' };
            biasEl.className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${colorMap[result.bias] || 'text-white/20'}`;

            const isWatching = result.bias === 'WATCHING' || !result.entry;
            document.getElementById('res-entry').innerText = isWatching ? 'N/A' : result.entry;
            document.getElementById('res-sl').innerText = isWatching ? 'N/A' : result.sl;
            document.getElementById('res-tp').innerText = isWatching ? 'N/A' : result.tp;
            document.getElementById('res-lot').innerText = isWatching ? 'N/A' : result.lots;
            document.getElementById('res-asset').innerText = result.asset || "GOLD";
            document.getElementById('res-logic').innerText = result.logic || "Awaiting structural confirmation at POI.";
            
            document.getElementById('result-screen').classList.remove('hidden');

        } catch (err) {
            console.error("OMNI-ERROR:", err);
            alert("CORE SYNC FAILED: Ensure 4 images are uploaded and API key is valid.");
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
