/** * OMNI—DUAL SOVEREIGN V76.0 
 * TUNE: AGGRESSIVE FREQUENCY SCALPING
 */

// ... (keep state, ui, stage, compress the same)

    ignite: async () => {
        const k = localStorage.getItem('ob_k'), b = localStorage.getItem('ob_b'), r = localStorage.getItem('ob_r');
        if (!k || !b || state.isSyncing) return ui.toggleSettings();

        state.isSyncing = true;
        const btn = document.getElementById('igniteBtn');
        btn.innerText = "HUNTING MICRO-ENTRIES...";

        // HIGH FREQUENCY INSTRUCTIONS
        const strategyPersona = state.mode === 'scalp' 
            ? `MODE: AGGRESSIVE SCALPER. 
               TARGET: Internal Liquidity Sweeps / M1 MSB. 
               ACCURACY: 70-80%. 
               FREQUENCY: High. Look for immediate momentum entries on M1/M5. 
               RR: 1:1.5 is sufficient. Don't wait for HTF swings.`
            : `MODE: DAY TRADER. 
               TARGET: Institutional BOS + FVG. 
               ACCURACY: 90%+. 
               FREQUENCY: Moderate. Wait for A+ confluences only.`;

        const prompt = `ACT AS OMNI-DUAL SOVEREIGN CORE. 
            ACCOUNT: $${b} | RISK: ${r}%.
            ${strategyPersona}
            
            TASK:
            1. Scrape current price levels. 
            2. For SCALP: Identify the nearest Liquidity Sweep or FVG tap for an immediate entry.
            3. CALCULATE LOTS: ($${b} * (${r}/100)) / (Entry-SL distance).
            4. BIAS "WATCHING" only if market is completely flat (0 volume).

            STRICT JSON ONLY:
            {"asset":"SYMBOL","bias":"BUY/SELL/WATCHING","entry":"0.00","sl":"0.00","tp":"0.00","lots":"0.00","logic":"10-word footprint"}`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${k}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    contents: [{ parts: [ { text: prompt }, ...state.payloads.filter(p => p).map(d => ({ inline_data: { mime_type: "image/jpeg", data: d } })) ] }],
                    generationConfig: { 
                        temperature: 0.4, // Increased slightly for better entry detection
                        topP: 0.8 
                    }
                })
            });

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

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
            alert("SYNC FAILED: Ensure all images are clear.");
        } finally {
            state.isSyncing = false;
            btn.innerText = "Execute Command";
        }
    }
// ... (rest of engine)
