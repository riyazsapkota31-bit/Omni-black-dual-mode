/**
 * OMNI—DUAL | SOVEREIGN ENGINE
 * MANDATES: STRICT MATH / ZERO HALLUCINATION / COUNCIL OF 8
 * MODEL LOCK: GEMINI 2.5 FLASH
 */

const state = {
    mode: 'scalp', // 'scalp' or 'day'
    payloads: [null, null, null, null],
    isSyncing: false
};

const engine = {
    setMode: (m) => {
        state.mode = m;
        const s = document.getElementById('btnScalp');
        const d = document.getElementById('btnDay');
        
        const activeClass = "flex-1 py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all";
        const inactiveClass = "flex-1 py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest text-white/30 transition-all bg-white/5 hover:bg-white/10";
        
        if(s && d) {
            s.className = m === 'scalp' ? activeClass : inactiveClass;
            d.className = m === 'day' ? activeClass : inactiveClass;
        }
    },

    stage: async (index) => {
        const fileInput = document.getElementById(`f${index}`);
        const file = fileInput?.files[0];
        if (!file) return;
        
        const box = document.getElementById(`box${index}`);
        const label = document.getElementById(`l${index}`);
        const ok = document.getElementById(`ok${index}`);
        
        // UI Confirmation
        if(box && label && ok) {
            label.classList.add('hidden');
            ok.classList.remove('hidden');
            box.classList.add('active-glow');
        }

        state.payloads[index] = await engine.extractPixels(file);
    },

    extractPixels: (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_RES = 2000; // Mandatory high-res for 100% Visual Scrape OCR
                    
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX_RES) { h *= MAX_RES / w; w = MAX_RES; } }
                    else { if (h > MAX_RES) { w *= MAX_RES / h; h = MAX_RES; } }
                    
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.95).split(',')[1]);
                };
            };
        });
    },

    ignite: async () => {
        const key = localStorage.getItem('ob_k');
        const bal = localStorage.getItem('ob_b');
        const risk = localStorage.getItem('ob_r');

        if (!key || !bal || !risk) return ui.toggleSettings();
        
        // Ensure strictly all 4 images or at least the Trigger and DXY exist.
        if (!state.payloads[2] || !state.payloads[3]) {
            return alert("[CRITICAL ERROR] Image Slots 3 (Trigger) and 4 (DXY) are strictly mandatory.");
        }

        if (state.isSyncing) return;
        state.isSyncing = true;
        
        const btn = document.getElementById('igniteBtn');
        if (btn) btn.innerText = "COUNCIL OF 8: AGGREGATING DATAPOINTS...";

        // STRICT SYSTEM PROMPT
        const prompt = `ACT AS OMNI-DUAL TRADING ENGINE.
        MODEL LOCKED: GEMINI 2.5 FLASH. 
        USER DATA: Balance: $${bal}, Risk: ${risk}%, Platform: XM Broker.
        MODE SELECTED: ${state.mode.toUpperCase()}.
        
        MANDATORY INSTRUCTIONS:
        1. 8-CORE AGGREGATOR: Cross-reference SMC, ICT, VSA, Price Action, Wyckoff, Fibonacci, Mean Reversion, and Elliott Wave. Select setup with highest profit potential.
        2. VISUAL SCRAPE: Perform exact OCR on the Y-Axis (Price) and X-Axis (Time). DO NOT simulate or guess prices. Calculate Entry, SL, TP based ONLY on visible candles.
        3. ASSET DETECTION: Identify the symbol from charts (e.g. BTCUSD, SOLUSD, XAUUSD, EURUSD).
        4. DXY SYNC: Evaluate Image 4 (DXY Index). If DXY conflicts with your trade bias, you MUST output WAIT.
        5. RR GUARD & GRADE-A FILTER: 
           - Scalping: 1m/5m, RR 1:1.5 to 1:4. 
           - Day Trading: 15m/1h, RR 1:4 to 1:10. 
           - If RR is below 1:1.5, or if setup is low conviction, output bias as WAIT and output "--" for entry, sl, tp, lots.
        6. LOT SIZING (XM MATH): Calculate precisely: Lot Size = ($${bal} * ${risk}/100) / (Entry - Stop Loss Distance). 
           - Normalization: Forex 1 Lot=100k, Crypto/Gold 1 Lot=1 unit.
        7. POI PROTOCOL: If bias is WAIT, identify the next Point of Interest (Watch Level) based on liquidity/OBs.
        8. SURGICAL LOGIC: Output exactly 10 to 15 words explaining the institutional footprint (Liquidity Sweeps, MSS, FVG, OB).

        OUTPUT STRICT JSON ONLY. NO CONVERSATIONAL FILLER. NO MARKDOWN TICKS.
        {
            "asset": "SYMBOL",
            "bias": "BUY" | "SELL" | "WAIT",
            "type": "${state.mode.toUpperCase()}",
            "entry": "0.00" | "--",
            "sl": "0.00" | "--",
            "tp": "0.00" | "--",
            "lots": "0.00" | "--",
            "poi": "0.00" | "--",
            "logic": "10-15 word string"
        }`;

        try {
            // STRICT MODEL LOCK: gemini-2.5-flash
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{ 
                        parts: [ 
                            { text: prompt }, 
                            ...state.payloads.filter(p => p !== null).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } })) 
                        ] 
                    }],
                    // Zero Hallucination Parameters
                    generationConfig: { temperature: 0.1, topP: 0.1 }
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error.message);

            const rawText = data.candidates[0].content.parts[0].text;
            
            // Regex to extract JSON strictly, ignoring any accidental markdown
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Output was not valid JSON.");
            
            const parsedData = JSON.parse(jsonMatch[0]);
            ui.renderData(parsedData);

        } catch (error) {
            console.error("Engine Error:", error);
            alert(`[SYSTEM FAILURE] ${error.message || "Ensure exact API key and chart clarity."}`);
        } finally {
            state.isSyncing = false;
            if (btn) btn.innerText = "Execute Structural Scan";
        }
    }
};

const ui = {
    toggleSettings: () => {
        const overlay = document.getElementById('settings');
        if(overlay) overlay.classList.toggle('hidden');
    },
    
    trigger: (index) => {
        const fileInput = document.getElementById(`f${index}`);
        if(fileInput) fileInput.click();
    },

    save: () => {
        const k = document.getElementById('key')?.value;
        const b = document.getElementById('bal')?.value;
        const r = document.getElementById('risk')?.value;

        if (!k || !b || !r) {
            alert("Hardware configuration incomplete. All fields mandatory.");
            return;
        }

        localStorage.setItem('ob_k', k);
        localStorage.setItem('ob_b', b);
        localStorage.setItem('ob_r', r);

        const sBtn = document.getElementById('saveBtn');
        if(sBtn) {
            sBtn.innerText = "SYSTEM SECURED & LOCKED";
            sBtn.classList.replace('bg-cyan-500', 'bg-emerald-500');
            
            setTimeout(() => {
                ui.toggleSettings();
                sBtn.innerText = "Lock Configuration";
                sBtn.classList.replace('bg-emerald-500', 'bg-cyan-500');
            }, 800);
        }
    },

    renderData: (data) => {
        // NULL SHIELDS (Anti-Crash checks)
        if (!data) return;
        
        const isWait = data.bias === 'WAIT';

        const fields = {
            'res-bias': data.bias || 'WAIT',
            'res-type': data.type || state.mode.toUpperCase(),
            'res-asset': data.asset || 'UNKNOWN',
            'res-entry': isWait ? '--' : (data.entry || '--'),
            'res-sl': isWait ? '--' : (data.sl || '--'),
            'res-tp': isWait ? '--' : (data.tp || '--'),
            'res-lot': isWait ? '--' : (data.lots || '--'),
            'res-poi': data.poi || '--',
            'res-logic': data.logic || 'No institutional footprint detected.'
        };

        for (const [id, value] of Object.entries(fields)) {
            const element = document.getElementById(id);
            if (element) element.innerText = value;
        }

        // Dynamic Color Routing
        const biasElement = document.getElementById('res-bias');
        if (biasElement) {
            const colorMap = {
                'BUY': 'text-emerald-400',
                'SELL': 'text-red-500',
                'WAIT': 'text-amber-400'
            };
            biasElement.className = `text-[100px] font-black italic leading-none tracking-tighter ${colorMap[data.bias] || 'text-white'}`;
        }

        const resultScreen = document.getElementById('result-screen');
        if (resultScreen) resultScreen.classList.remove('hidden');
    }
};

// INITIALIZATION SEQUENCE
window.onload = () => {
    const k = localStorage.getItem('ob_k');
    const b = localStorage.getItem('ob_b');
    const r = localStorage.getItem('ob_r');
    
    if (k) document.getElementById('key').value = k;
    if (b) document.getElementById('bal').value = b;
    if (r) document.getElementById('risk').value = r;
};
