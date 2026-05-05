/** * OMNI—DUAL SOVEREIGN V75.5 
 * FIX: STRICT DATA NORMALIZATION & UNDEFINED-SHIELD
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
        btn.innerText = "SCRAPING MARKET DATA...";

        const strategyPersona = state.mode === 'scalp' 
            ? `MODE: SCALPER (70-80% SURE SCALPS). Speed focus. M1 entry. Low risk.`
            : `MODE: DAY TRADER (85-99% PROBABILITY). Institutional confluences. A and A+ setups only.`;

        const prompt = `ACT AS OMNI-DUAL SOVEREIGN. 
            ACCOUNT: $${b} | RISK: ${r}%.
            ${strategyPersona}
            
            1. Extract Price Data. 
            2. Calculate Lots: ($${b} * (${r}/100)) / (Entry-SL distance).
            3. If market is sideways/uncertain, BIAS must be "WATCHING".

            STRICT JSON ONLY:
            {"asset":"SYMBOL","bias":"BUY/SELL/WATCHING","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","logic":"10-word explanation"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{ parts: [ { text: prompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } })) ] }]
                })
            });

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

            // THE NORMALIZER (STOPS "UNDEFINED")
            const result = {
                asset: parsed.asset || "N/A",
                bias: parsed.bias || "WATCHING",
                entry: parsed.entry || "N/A",
                sl: parsed.sl || "N/A",
                tp: parsed.tp || "N/A",
                lots: parsed.lots || "N/A",
                logic: parsed.logic || "Awaiting structural confirmation."
            };

            const isW = result.bias === 'WATCHING';
            const colors = { 'BUY': 'text-emerald-400', 'SELL': 'text-red-500', 'WATCHING': 'text-amber-400' };

            document.getElementById('res-bias').innerText = result.bias;
            document.getElementById('res-bias').className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${colors[result.bias]}`;
            document.getElementById('res-asset').innerText = result.asset;
            document.getElementById('res-entry').innerText = isW ? 'N/A' : result.entry;
            document.getElementById('res-sl').innerText = isW ? 'N/A' : result.sl;
            document.getElementById('res-tp').innerText = isW ? 'N/A' : result.tp;
            document.getElementById('res-lot').innerText = isW ? 'N/A' : result.lots;
            document.getElementById('res-logic').innerText = result.logic;
            
            document.getElementById('result-screen').classList.remove('hidden');

        } catch (err) {
            console.error(err);
            alert("SYNC FAILED: Ensure all 4 images are uploaded.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Execute Command";
        }
    }
};
