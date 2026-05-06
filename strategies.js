/**
 * OMNI—DUAL | SOVEREIGN ENGINE v100.2
 * MANDATE: GEMINI 2.5 FLASH LOCK + 503 FAILOVER
 */

const state = {
    mode: 'scalp',
    payloads: [null, null, null, null],
    isSyncing: false
};

const engine = {
    setMode: (m) => {
        state.mode = m;
        const s = document.getElementById('btnScalp'), d = document.getElementById('btnDay');
        const active = "flex-1 py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all";
        const inactive = "flex-1 py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest text-white/30 transition-all bg-white/5";
        if(s && d) { s.className = m === 'scalp' ? active : inactive; d.className = m === 'day' ? active : inactive; }
    },

    stage: async (i) => {
        const input = document.getElementById(`f${i}`);
        if (!input?.files[0]) return;
        const box = document.getElementById(`box${i}`), label = document.getElementById(`l${i}`), ok = document.getElementById(`ok${i}`);
        if(box && label && ok) { label.classList.add('hidden'); ok.classList.remove('hidden'); box.classList.add('active-glow'); }
        state.payloads[i] = await engine.compress(input.files[0]);
    },

    compress: (file) => {
        return new Promise(res => {
            const r = new FileReader(); r.readAsDataURL(file);
            r.onload = (e) => {
                const img = new Image(); img.src = e.target.result;
                img.onload = () => {
                    const c = document.createElement('canvas'); const ctx = c.getContext('2d');
                    const max = 2000; let w = img.width, h = img.height;
                    if (w > h) { if (w > max) { h *= max / w; w = max; } } else { if (h > max) { w *= max / h; h = max; } }
                    c.width = w; c.height = h; ctx.drawImage(img, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', 0.9).split(',')[1]);
                };
            };
        });
    },

    ignite: async () => {
        const key = localStorage.getItem('ob_k'), bal = localStorage.getItem('ob_b'), risk = localStorage.getItem('ob_r');
        if (!key || !bal || state.isSyncing) return ui.toggleSettings();
        if (!state.payloads[2] || !state.payloads[3]) return alert("TRIGGER AND DXY CHARTS ARE MANDATORY.");

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        btn.innerText = "COUNCIL OF 8 ANALYZING...";

        const prompt = `ACT AS OMNI-DUAL ENGINE. MODEL LOCK: GEMINI 2.5 FLASH. 
        USER_CONFIG: Balance $${bal}, Risk ${risk}%, Platform XM. MODE: ${state.mode.toUpperCase()}.
        1. 8-CORE STRATEGY: SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, Elliott Wave.
        2. DXY FILTER: Identify Chart 4. If DXY conflicts with Bias, Bias = WAIT.
        3. RR GUARD: If RR < 1:1.5, Bias = WAIT.
        4. XM MATH: Lot Size = ($${bal} * ${risk}/100) / (Entry - SL distance).
        JSON ONLY: {"asset":"SYM","bias":"BUY/SELL/WAIT","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","logic":"10-15 words"}`;

        try {
            let model = "gemini-2.5-flash";
            let payload = { contents: [{ parts: [{ text: prompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } })) ] }], generationConfig: { temperature: 0.1 } };
            
            let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
            });

            let data = await response.json();
            
            // FAILOVER PROTOCOL for 503 Errors
            if (data.error && (data.error.code === 503 || data.error.message.includes("high demand"))) {
                btn.innerText = "OVERLOAD. ENGAGING FLASH LITE...";
                model = "gemini-2.5-flash-lite";
                response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
                });
                data = await response.json();
            }

            if (data.error) throw new Error(data.error.message);
            const raw = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
            ui.render(parsed);

        } catch (err) { alert(`[CRITICAL] ${err.message}`); }
        finally { state.isSyncing = false; btn.innerText = "Execute Surgical Scan"; }
    }
};

const ui = {
    toggleSettings: () => document.getElementById('settings').classList.toggle('hidden'),
    trigger: (i) => document.getElementById(`f${i}`).click(),
    save: () => {
        const k = document.getElementById('key').value, b = document.getElementById('bal').value, r = document.getElementById('risk').value;
        if(!k || !b) return alert("Configuration missing.");
        localStorage.setItem('ob_k', k); localStorage.setItem('ob_b', b); localStorage.setItem('ob_r', r);
        const sBtn = document.getElementById('saveBtn');
        sBtn.innerText = "SYSTEM LOCKED"; sBtn.classList.replace('bg-cyan-500', 'bg-emerald-500');
        setTimeout(() => { ui.toggleSettings(); sBtn.innerText = "Lock Configuration"; sBtn.classList.replace('bg-emerald-500', 'bg-cyan-500'); }, 800);
    },
    render: (d) => {
        const isW = d.bias === 'WAIT';
        const fields = { 'res-bias': d.bias, 'res-asset': d.asset, 'res-entry': isW ? '--' : d.entry, 'res-sl': isW ? '--' : d.sl, 'res-tp': isW ? '--' : d.tp, 'res-lot': isW ? '--' : d.lots, 'res-logic': d.logic };
        for (const [id, val] of Object.entries(fields)) { if(document.getElementById(id)) document.getElementById(id).innerText = val; }
        document.getElementById('result-screen').classList.remove('hidden');
    }
};

window.onload = () => {
    if(localStorage.getItem('ob_k')) {
        document.getElementById('key').value = localStorage.getItem('ob_k');
        document.getElementById('bal').value = localStorage.getItem('ob_b');
        document.getElementById('risk').value = localStorage.getItem('ob_r');
    }
};
