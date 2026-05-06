/**
 * OMNI—BLACK | DUAL SOVEREIGN v100
 * ENGINE: COUNCIL OF 8 AGGREGATOR
 * MANDATE: ZERO HALLUCINATION / XM-NORMALIZATION
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
        const inactive = "flex-1 py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest text-white/20 transition-all bg-white/5";
        if(s && d) {
            s.className = m === 'scalp' ? active : inactive;
            d.className = m === 'day' ? active : inactive;
        }
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`)?.files[0];
        if (!file) return;
        
        // Visual Feedback
        const box = document.getElementById(`box${i}`);
        const label = document.getElementById(`l${i}`);
        const ok = document.getElementById(`ok${i}`);
        
        if(box && label && ok) {
            label.classList.add('hidden');
            ok.classList.remove('hidden');
            box.style.borderColor = '#00f2ff';
            box.style.boxShadow = '0 0 15px rgba(0,242,255,0.2)';
        }

        state.payloads[i] = await engine.compress(file);
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
                    const max = 2000; // Ultra-res for OCR precision
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > max) { h *= max / w; w = max; } }
                    else { if (h > max) { w *= max / h; h = max; } }
                    c.width = w; c.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    res(c.toDataURL('image/jpeg', 0.95).split(',')[1]);
                };
            };
        });
    },

    ignite: async () => {
        const k = localStorage.getItem('ob_k'), b = localStorage.getItem('ob_b'), r = localStorage.getItem('ob_r');
        if (!k || !b || state.isSyncing) return ui.toggleSettings();
        if (!state.payloads[2] || !state.payloads[3]) return alert("CRITICAL: Box 3 (Trigger) and Box 4 (DXY) Mandatory.");

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        if(btn) btn.innerText = "COUNCIL OF 8 ANALYZING...";

        const prompt = `ACT AS OMNI-BLACK v100. 
        USER_CONFIG: Balance $${b}, Risk ${r}%, Platform XM.
        MODE: ${state.mode.toUpperCase()}.
        
        1. 8-CORE STRATEGY: Cross-ref SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, Elliott Wave.
        2. DXY SYNC: Analyze 4th image. If DXY is bullish, penalize Longs on XXXUSD.
        3. PIXEL SCRAPE: OCR Y-axis precisely. Detect symbol (BTC, SOL, XAU, etc).
        4. GRADE-A FILTER: If RR < 1:1.5 or low conviction, bias=WAIT.
        5. MATH: Lot Size = ($${b} * ${r}/100) / (SL Distance). 
           XM Calibration: Forex 1 Lot=100k. Crypto/Gold 1 Lot=1.
        
        OUTPUT STRICT JSON ONLY:
        {"asset":"SYM","bias":"BUY/SELL/WAIT","type":"${state.mode.toUpperCase()}","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","poi":"0.00","logic":"10-15 word institutional summary"}`;

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
            const parsed = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);

            ui.render(parsed);

        } catch (err) {
            console.error(err);
            alert("ENGINE FAILURE: Check API/Resolution.");
        } finally {
            state.isSyncing = false;
            if(btn) btn.innerText = "Execute Surgical Scan";
        }
    }
};

const ui = {
    toggleSettings: () => document.getElementById('settings')?.classList.toggle('hidden'),
    trigger: (i) => document.getElementById(`f${i}`)?.click(),
    save: () => {
        localStorage.setItem('ob_k', document.getElementById('key').value);
        localStorage.setItem('ob_b', document.getElementById('bal').value);
        localStorage.setItem('ob_r', document.getElementById('risk').value);
        ui.toggleSettings();
    },
    render: (data) => {
        const isW = data.bias === 'WAIT';
        
        // Null Shields & Assignment
        const elements = {
            'res-bias': data.bias || 'WAIT',
            'res-type': data.type || '--',
            'res-asset': data.asset || '--',
            'res-entry': isW ? '--' : data.entry,
            'res-sl': isW ? '--' : data.sl,
            'res-tp': isW ? '--' : data.tp,
            'res-lot': isW ? '--' : data.lots,
            'res-poi': data.poi || '--',
            'res-logic': data.logic || '--'
        };

        for (const [id, val] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if(el) el.innerText = val;
        }

        const biasEl = document.getElementById('res-bias');
        if(biasEl) {
            const colors = { 'BUY': 'text-emerald-400', 'SELL': 'text-red-500', 'WAIT': 'text-amber-400' };
            biasEl.className = `text-8xl font-black italic tracking-tighter uppercase ${colors[data.bias] || 'text-white'}`;
        }

        document.getElementById('result-screen')?.classList.remove('hidden');
    }
};
