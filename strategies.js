/** * OMNI—DUAL | CORE V62.6
 * FIX: API VERSION LOCK (2.5 FLASH) & UI COMPRESSION
 */

let chart_files = [null, null, null, null];

// Load local storage on start
window.onload = () => {
    document.getElementById('api_key').value = localStorage.getItem('omni_k') || '';
    document.getElementById('balance').value = localStorage.getItem('omni_b') || '';
    document.getElementById('risk').value = localStorage.getItem('omni_r') || '';
};

function toggle_interface() {
    const p = document.getElementById('settingsPanel');
    const t = document.getElementById('terminalUI');
    const isHidden = p.classList.toggle('hidden');
    // Prevents "permeability" and shrinking by removing terminal from flow
    t.style.display = isHidden ? 'flex' : 'none';
}

function save_config() {
    localStorage.setItem('omni_k', document.getElementById('api_key').value);
    localStorage.setItem('omni_b', document.getElementById('balance').value);
    localStorage.setItem('omni_r', document.getElementById('risk').value);
    toggle_interface();
}

function trigger_upload(i) { document.getElementById(`f${i}`).click(); }

function process_upload(i) {
    const file = document.getElementById(`f${i}`).files[0];
    if (file) {
        chart_files[i] = file;
        document.getElementById(`l${i}`).classList.add('hidden');
        document.getElementById(`t${i}`).classList.remove('hidden');
        document.getElementById(`b${i}`).classList.add('active-border');
    }
}

async function run_logic() {
    const key = localStorage.getItem('omni_k');
    if (!key) return alert("CORE REJECTED: SYNC API KEY.");

    const btn = document.getElementById('execBtn');
    btn.disabled = true;
    btn.innerText = "NEURAL SYNCING...";

    try {
        const image_parts = await Promise.all(
            chart_files.map(f => f ? encode_image(f) : null)
        );

        // FORCED 2.5 FLASH ENDPOINT: Resolves 400/404 mismatches
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        
        const body = {
            contents: [{
                parts: [
                    { text: "ACT AS OMNI-BLACK SMC ENGINE. Analyze charts for Market Displacement. Output JSON: {'bias':'BUY/SELL','logic':'one_sentence'}" },
                    ...image_parts.filter(d => d).map(b64 => ({
                        inline_data: { mime_type: "image/jpeg", data: b64 }
                    }))
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (data.error) throw new Error(`${data.error.status}: ${data.error.message}`);
        
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        alert(`TERMINAL SYNCED\n\nBIAS: ${result.bias}\nLOGIC: ${result.logic}`);

    } catch (e) {
        alert("ENGINE REJECTED: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Execute Command";
    }
}

function encode_image(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}
