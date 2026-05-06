/** * OMNI—DUAL SOVEREIGN V78.5 
 * BROKER: XM STANDARD | ASSET: AUTO-DETECT
 * FIX: Persistent UI & Enhanced Math Logic
 */

const state = { 
    mode: 'scalp', 
    payloads: [null, null, null, null], 
    isSyncing: false 
};

const ui = {
    toggleSettings: () => {
        const settings = document.getElementById('settings');
        settings.classList.toggle('hidden');
        
        // HYDRATION: Fill inputs with saved data when opening
        if (!settings.classList.contains('hidden')) {
            document.getElementById('key').value = localStorage.getItem('ob_k') || '';
            document.getElementById('bal').value = localStorage.getItem('ob_b') || '';
            document.getElementById('risk').value = localStorage.getItem('ob_r') || '';
        }
    },
    trigger: (i) => document.getElementById(`f${i}`).click(),
    save: () => {
        const k = document.getElementById('key').value;
        const b = document.getElementById('bal').value;
        const r = document.getElementById('risk').value;
        
        localStorage.setItem('ob_k', k);
        localStorage.setItem('ob_b', b);
        localStorage.setItem('ob_r', r);
        
        alert("CONFIG LOCKED: Settings Saved.");
        ui.toggleSettings();
    }
};

const engine = {
    setMode: (m) => {
        state.mode = m;
        const s = document.getElementById('btnScalp'), d = document.getElementById('btnDay');
        const active = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg transition-all";
        const inactive = "flex-1 py-3.5 rounded-[20px] text-[9px] font-900 uppercase tracking-widest text-white/20 transition-all";
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
        
        // Critical Logic Check: Box 2 (1M Trigger) and Box 3 (DXY) are essential
        if (!state.payloads[2] || !state.payloads[3]) {
            alert("Surgical error: Box 3 (1M) and Box 4 (DXY) are mandatory for analysis.");
            return;
        }

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        btn.innerText = "HUNTING INSTITUTIONAL POI...";

        const strategyLogic = state.mode === 'scalp' 
            ? `MODE: AGGRESSIVE SCALPER. Strategies: ICT Silver Bullet, M1 Liquidity Grab. RR 1:1.5 - 1:4. Focus: High frequency internal sweeps.`
            : `MODE: DAY TRADER. Strategies: SMC OrderBlocks, Wyckoff Spring, BOS/ChoCh. RR 1:4 - 1:10. Focus: A+ Institutional setups only.`;

        const prompt = `ACT AS OMNI-DUAL SOVEREIGN V78.5. 
            ACCOUNT: $${b} (XM STANDARD ACCOUNT) | RISK: ${r}%.
            ${strategyLogic}
            
            OPERATIONAL TASKS:
            1. OCR ASSET: Identify symbol from charts. 
            2. ANALYSIS: Sync 1H/15M bias with 1M trigger entry. 
            3. DXY FILTER: Identify Dollar Index trend. Avoid "Dollar Traps" (don't buy pairs if DXY is pumping). 
            4. MATH: Calculate Lot Size = ($${b} * ${r}/100) / (SL Distance in Price Points).
               SPEC: For Forex 1 Lot=100k units. For Crypto/Gold 1 Lot=1 unit.

            STRICT JSON OUTPUT ONLY:
            {"asset":"SYMBOL","bias":"BUY/SELL/WATCHING","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","logic":"10-15 word tech justification"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{ parts: [ { text: prompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } })) ] }],
                    generationConfig: { temperature: 0.1, topP: 0.1 }
                })
            });

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            
            // Refined Regex for JSON parsing
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("JSON_PARSE_FAILED");
            const parsed = JSON.parse(jsonMatch[0]);

            const result = {
                asset: parsed.asset || "N/A",
                bias: (parsed.bias || "WATCHING").toUpperCase(),
                entry: parsed.entry || "--",
                sl: parsed.sl || "--",
                tp: parsed.tp || "--",
                lots: parsed.lots || "0.00",
                logic: parsed.logic || "Awaiting structural confirmation."
            };

            const isW = result.bias === 'WATCHING';
            const colors = { 'BUY': 'text-emerald-400', 'SELL': 'text-red-500', 'WATCHING': 'text-amber-400' };

            document.getElementById('res-bias').innerText = result.bias;
            document.getElementById('res-bias').className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${colors[result.bias] || 'text-white'}`;
            document.getElementById('res-asset').innerText = result.asset;
            document.getElementById('res-entry').innerText = isW ? '--' : result.entry;
            document.getElementById('res-sl').innerText = isW ? '--' : result.sl;
            document.getElementById('res-tp').innerText = isW ? '--' : result.tp;
            document.getElementById('res-lot').innerText = isW ? '--' : result.lots;
            document.getElementById('res-logic').innerText = result.logic;
            
            document.getElementById('result-screen').classList.remove('hidden');

        } catch (err) {
            console.error(err);
            alert("SYNC FAILED: Ensure API key is valid and all 4 charts are uploaded clearly.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Analyze Market";
        }
    }
};

// AUTO-LOAD on Page Refresh
window.onload = () => {
    if (localStorage.getItem('ob_k')) {
        console.log("Sovereign Core: Configuration Hydrated.");
    }
};
