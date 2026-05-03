/** * OMNI—DUAL | CORE V62.6 REWRITE
 * STATUS: FIXED VERSION LOCK (GEMINI 2.5 FLASH)
 */

let engine_files = [null, null, null, null];

// Initialization
window.onload = () => {
    document.getElementById('api_in').value = localStorage.getItem('omni_key') || '';
    document.getElementById('bal_in').value = localStorage.getItem('omni_bal') || '';
    document.getElementById('risk_in').value = localStorage.getItem('omni_risk') || '';
};

function ui_toggle() {
    const p = document.getElementById('settingsPanel');
    const t = document.getElementById('terminalContainer');
    const isHidden = p.classList.toggle('hidden');
    // Force terminal off-screen to prevent layout artifacts
    t.style.display = isHidden ? 'flex' : 'none';
}

function save_config() {
    localStorage.setItem('omni_key', document.getElementById('api_in').value);
    localStorage.setItem('omni_bal', document.getElementById('bal_in').value);
    localStorage.setItem('omni_risk', document.getElementById('risk_in').value);
    ui_toggle();
}

function trigger_file(i) { document.getElementById(`f${i}`).click(); }

function load_file(i) {
    const file = document.getElementById(`f${i}`).files[0];
    if (file) {
        engine_files[i] = file;
        document.getElementById(`label${i}`).classList.add('hidden');
        document.getElementById(`tick${i}`).classList.remove('hidden');
        document.getElementById(`box${i}`).classList.add('active-border');
    }
}

async function run_engine() {
    const key = localStorage.getItem('omni_key');
    if (!key) return alert("CORE REJECTED: API KEY MISSING.");

    const btn = document.getElementById('execBtn');
    btn.disabled = true;
    btn.innerText = "NEURAL HANDSHAKE...";

    try {
        const image_data = await Promise.all(
            engine_files.map(f => f ? encode_file(f) : null)
        );

        // FORCED 2.5 FLASH ENDPOINT
        const api_url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        
        const request_body = {
            contents: [{
                parts: [
                    { text: "ACT AS OMNI-DUAL TRADING ENGINE. Analyze SMC/ICT structures for high-probability setups. Output ONLY valid JSON: {'bias': 'BULLISH/BEARISH', 'target': 'Price_Level', 'logic': 'one_sentence'}" },
                    ...image_data.filter(d => d).map(b64 => ({
                        inline_data: { mime_type: "image/jpeg", data: b64 }
                    }))
                ]
            }]
        };

        const response = await fetch(api_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request_body)
        });

        const json = await response.json();
        if (json.error) throw new Error(`${json.error.status}: ${json.error.message}`);
        
        const trade = JSON.parse(json.candidates[0].content.parts[0].text);
        alert(`STRATEGY SYNCED\n\nBIAS: ${trade.bias}\nTARGET: ${trade.target}\nLOGIC: ${trade.logic}`);

    } catch (e) {
        alert("CRITICAL ERROR: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

function encode_file(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}
