/** * OMNI—BLACK FINAL SOVEREIGN V73.0
 * HARD-LOCKED MODELS: gemini-2.5-flash & gemini-2.5-flash-lite
 */

const state = {
    mode: 'scalp',
    payloads: [null, null, null, null],
    isSyncing: false
};

const ui = {
    toggleSettings: () => document.getElementById('settings').classList.toggle('hidden'),
    trigger: (i) => document.getElementById(`f${i}`).click(),
    log: (msg) => {
        const area = document.getElementById('logArea');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = `> ${msg}`;
        area.prepend(entry);
    },
    save: () => {
        localStorage.setItem('ob_k', document.getElementById('key').value);
        localStorage.setItem('ob_b', document.getElementById('bal').value);
        localStorage.setItem('ob_r', document.getElementById('risk').value);
        ui.toggleSettings();
        ui.log("PARAMETERS LOCKED. DUAL-CORE READY.");
    }
};

const engine = {
    setMode: (m) => {
        state.mode = m;
        const s = document.getElementById('btnScalp'), d = document.getElementById('btnDay');
        s.className = m === 'scalp' ? "flex-1 py-4 rounded-[25px] text-[10px] font-900 uppercase tracking-widest bg-cyan-500 text-black" : "flex-1 py-4 rounded-[25px] text-[10px] font-900 uppercase tracking-widest text-white/20";
        d.className = m === 'day' ? "flex-1 py-4 rounded-[25px] text-[10px] font-900 uppercase tracking-widest bg-cyan-500 text-black" : "flex-1 py-4 rounded-[25px] text-[10px] font-900 uppercase tracking-widest text-white/20";
        ui.log(`MODE SWITCHED: ${m.toUpperCase()}`);
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`).files[0];
        if (file) {
            document.getElementById(`l${i}`).classList.add('hidden');
            document.getElementById(`ok${i}`).classList.remove('hidden');
            document.getElementById(`box${i}`).classList.add('active-ring');
            state.payloads[i] = await engine.processImage(file);
            ui.log(`CHANNEL ${i} SYNCED.`);
        }
    },

    processImage: (file) => {
        return new Promise(res => {
            const r = new FileReader(); r.readAsDataURL(file);
            r.onload = (e) => {
                const img = new Image(); img.src = e.target.result;
                img.onload = () => {
                    const c = document.createElement('canvas');
                    const scale = 1440 / img.width; 
                    c.width = 1440; c.height = img.height * scale;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0, c.width, c.height);
                    res(c.toDataURL('image/jpeg', 0.9).split(',')[1]);
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
        ui.log("IGNITING DUAL-CORE HANDSHAKE...");

        const SCALPING_LOGIC = `MODE: SCALPING. Focus: 1M/15M. Strategy: High-frequency Liquidity Sweeps + MSS. Tight Stop Loss. Target RR: 1:2 to 1:3.`;
        const DAY_TRADE_LOGIC = `MODE: DAY TRADING. Focus: 1H/15M. Strategy: Institutional Order Flow, Wyckoff Accumulation, Daily Bias. Target RR: 1:4 to 1:8. High Precision.`;

        try {
            const systemPrompt = `ACT AS OMNI-BLACK 8-CORE TRADING ENGINE. 
                ${state.mode === 'scalp' ? SCALPING_PROMPT : DAY_TRADING_PROMPT}
                CAPITAL: $${b} | RISK: ${r}%. Frameworks: SMC, ICT.
                Instructions: Identify Asset, Liquidity Sweeps, and FVG Entry. 
                JSON ONLY: {"status":"SIGNAL/WAIT","asset":"SYM","bias":"BUY/SELL","entry":"VAL","sl":"VAL","tp1":"VAL","tp2":"VAL","lots":"VAL","logic":"Short technical reason"}`;

            const payload = {
                contents: [{
                    parts: [{ text: systemPrompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } }))]
                }]
            };

            const endpoints = [
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`,
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`
            ];

            const responses = await Promise.all(endpoints.map(u => 
                fetch(u, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) })
                .then(res => res.json())
            ));

            const sigA = JSON.parse(responses[0].candidates[0].content.parts[0].text.replace(/```json|```/g, ''));
            const sigB = JSON.parse(responses[1].candidates[0].content.parts[0].text.replace(/```json|```/g, ''));

            if (sigA.status === "WAIT" || sigA.bias !== sigB.bias) {
                ui.log("CONFLUENCE FAILED. STAND DOWN.");
                alert(`STAY OUT: ${sigA.logic}`);
            } else {
                ui.log("SIGNAL ACQUIRED.");
                alert(`[${sigA.asset}] ${state.mode.toUpperCase()}\nBIAS: ${sigA.bias}\nENTRY: ${sigA.entry}\nSL: ${sigA.sl}\nTP1: ${sigA.tp1}\nTP2: ${sigA.tp2}\nLOTS: ${sigA.lots}\n\nLOGIC: ${sigA.logic}`);
            }
        } catch (e) {
            ui.log("SYNC ERROR.");
            alert("Error: Check API Key and ensure all images are uploaded.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Execute Sovereign Logic";
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
