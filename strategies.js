/** * OMNI—BLACK SOVEREIGN V73.0 
 * INTERNAL ENGINE: DUAL-CORE LATENCY OPTIMIZATION
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
        // Strict UI state preservation
        const s = document.getElementById('btnScalp'), d = document.getElementById('btnDay');
        const active = "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest bg-cyan-500 text-black shadow-lg";
        const inactive = "flex-1 py-5 rounded-[32px] text-[10px] font-900 uppercase tracking-widest text-white/20";
        s.className = m === 'scalp' ? active : inactive;
        d.className = m === 'day' ? active : inactive;
    },

    stage: async (i) => {
        const file = document.getElementById(`f${i}`).files[0];
        if (file) {
            document.getElementById(`l${i}`).classList.add('hidden');
            document.getElementById(`ok${i}`).classList.remove('hidden');
            document.getElementById(`box${i}`).classList.add('active-ring');
            
            // COMPRESSION START: Shaves minutes off the upload time
            state.payloads[i] = await engine.compress(file);
        }
    },

    compress: (file) => {
        return new Promise(res => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Optimized for technical chart clarity at lower weight
                    const maxWidth = 1024; 
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    res(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]); 
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

        const prompt = `CORE: OMNI-BLACK 2.5. MODE: ${state.mode.toUpperCase()}. BAL: $${b}. RISK: ${r}%. Analyze 4-chart confluence for SMC/ICT. Return JSON: {"asset":"SYM","bias":"DIR","entry":"0.0","sl":"0.0","tp":"0.0","logic":"Reason"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            ...state.payloads.filter(p => p).map(data => ({ inline_data: { mime_type: "image/jpeg", data } }))
                        ]
                    }]
                })
            });

            const data = await response.json();
            const cleanText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '');
            const res = JSON.parse(cleanText);

            alert(`[${res.asset}] ${res.bias}\nENTRY: ${res.entry}\nSL: ${res.sl}\nTP: ${res.tp}\n\nLOGIC: ${res.logic}`);
        } catch (err) {
            alert("ENGINE TIMEOUT: Check API Key or Connection.");
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
