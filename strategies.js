const state = { mode: 'scalp', payloads: [null, null, null, null], isSyncing: false };

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
                    const scale = 1024 / img.width;
                    c.width = 1024; c.height = img.height * scale;
                    const ctx = c.getContext('2d');
                    ctx.drawImage(img, 0, 0, c.width, c.height);
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

        const prompt = `CORE: OMNI-BLACK. MODE: ${state.mode.toUpperCase()}. CAPITAL: $${b} RISK: ${r}%. Analyze 4-chart confluence (SMC/ICT). 
        STRICT MANDATE: Logic field MUST be 15 words or fewer. 
        JSON ONLY: {"asset":"SYM","bias":"BUY/SELL/WATCHING","entry":"VAL","sl":"VAL","tp":"VAL","lots":"VAL","logic":"15-word max logic"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } }))] }] })
            });

            const data = await response.json();
            const res = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json|```/g, ''));

            const biasEl = document.getElementById('res-bias');
            biasEl.innerText = res.bias;
            biasEl.className = `text-[110px] font-900 italic leading-none tracking-tighter uppercase ${res.bias === 'BUY' ? 'text-emerald-400' : res.bias === 'SELL' ? 'text-red-500' : 'text-white/20'}`;
            
            document.getElementById('res-entry').innerText = res.entry;
            document.getElementById('res-sl').innerText = res.sl;
            document.getElementById('res-tp').innerText = res.tp;
            document.getElementById('res-lot').innerText = res.lots;
            document.getElementById('res-asset').innerText = res.asset;
            document.getElementById('res-logic').innerText = res.logic;
            document.getElementById('result-screen').classList.remove('hidden');
        } catch (e) { alert("SYNC ERROR"); } finally { state.isSyncing = false; btn.innerText = "Execute Signal"; }
    }
};

window.onload = () => {
    if(localStorage.getItem('ob_k')) {
        document.getElementById('key').value = localStorage.getItem('ob_k');
        document.getElementById('bal').value = localStorage.getItem('ob_b');
        document.getElementById('risk').value = localStorage.getItem('ob_r');
    }
};
