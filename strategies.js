/** * OMNI—DUAL | NEURAL CORE V62.6
 * MODEL: GEMINI-2.5-FLASH
 * PATCH: UPLOAD PERSISTENCE + 4-CHART SQUASH
 */

// Global State
var files = [null, null, null, null];
const ASSET_CALC = { CRYPTO: 1, FOREX: 10, COMMODITY: 100 };

/**
 * UI & UPLOAD HANDLERS
 */
function injectGallery(i) { 
    document.getElementById(`f${i}`).click(); 
}

function handleFile(i) {
    const input = document.getElementById(`f${i}`);
    const f = input.files[0];
    
    if (!f) return;

    // Store file reference
    files[i] = f;

    // UI Masking: Hide icons and show 'Uploaded' Tick
    document.getElementById(`status${i}`).classList.add('hidden');
    document.getElementById(`tick${i}`).classList.remove('hidden');
    document.getElementById(`c${i}`).classList.add('active-box');

    // Reset input value so the same file can be re-uploaded if needed
    input.value = null; 
    console.log(`[OMNI] Node ${i} Synced: ${f.name}`);
}

function toggleSettings() { 
    document.getElementById('settingsPanel').classList.toggle('hidden'); 
}

function saveCore() {
    const k = document.getElementById('apiKeyIn').value;
    const b = document.getElementById('balIn').value;
    const r = document.getElementById('riskIn').value;
    
    localStorage.setItem('omni_k', k);
    localStorage.setItem('omni_b', b);
    localStorage.setItem('omni_r', r);
    
    const syncBtn = event.target;
    syncBtn.innerText = "CORE SYNCED";
    syncBtn.style.background = "#00f2ff";
    
    setTimeout(() => {
        syncBtn.innerText = "Sync Core";
        syncBtn.style.background = "white";
        toggleSettings();
    }, 800);
}

/**
 * NEURAL PROCESSING
 */
async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    // Validation
    if (files.filter(f => f).length < 2) {
        return alert("OMNI: MINIMUM 2 CHARTS REQUIRED FOR SYNC.");
    }
    if (!key) return alert("OMNI: HARDWARE LINK OFFLINE. ENTER API KEY.");

    btn.disabled = true;
    btn.innerText = "SQUASHING PAYLOAD...";

    try {
        // Step 1: Compress all charts to fit API token limits
        const dataBuffers = await Promise.all(
            files.map(f => f ? compressChart(f) : Promise.resolve(null))
        );

        btn.innerText = "NEURAL HANDSHAKE...";

        // Step 2: Transmit to Gemini
        const signal = await fetchNeuralSignal(key, dataBuffers, isDay);
        
        // Step 3: Render Analysis
        displayOutput(signal);
        
        document.getElementById('outPanel').classList.remove('hidden');
        document.getElementById('outPanel').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        alert("CRITICAL ERROR: API REJECTED. REDUCE CHART COMPLEXITY OR CHECK KEY.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

/**
 * RECURSIVE COMPRESSION ENGINE
 * Forces images into 512px max dimension to bypass 4-image rejection limits.
 */
async function compressChart(f) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                const maxDim = 512; 
                const scale = maxDim / Math.max(img.width, img.height);
                
                cv.width = img.width * scale; 
                cv.height = img.height * scale;
                
                const ctx = cv.getContext('2d');
                ctx.fillStyle = "#000"; // Prevent transparency issues
                ctx.fillRect(0, 0, cv.width, cv.height);
                ctx.drawImage(img, 0, 0, cv.width, cv.height);
                
                // 0.35 quality provides the best balance of readability and small file size
                resolve(cv.toDataURL('image/jpeg', 0.35));
            };
            img.onerror = () => reject("Image Load Fail");
        };
        r.onerror = () => reject("File Read Fail");
    });
}

/**
 * API TRANSMISSION
 */
async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const mode = isDay ? "SURGICAL DAY (1H/15M)" : "AGGRESSIVE SCALP (1M/15M)";

    const prompt = `[OMNI—V6]
    MODE: ${mode}
    STRATEGY: SMC/ICT (Liquidity Sweeps, Market Displacement).
    JSON: {"bias":"BUY|SELL", "ticker":"SYM", "entry":number, "sl":number, "tp":number, "logic":"short summary", "conf":1-8, "type":"CRYPTO|FOREX"}`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { 
        if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); 
    });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            contents: [{ parts: parts }], 
            generationConfig: { 
                response_mime_type: "application/json", 
                temperature: 0.1 
            } 
        })
    });

    if (!res.ok) throw new Error("REJECTED");
    
    const json = await res.json();
    const rawText = json.candidates[0].content.parts[0].text;
    return JSON.parse(rawText.replace(/```json|```/g, "").trim());
}

/**
 * UI DATA RENDER
 */
function displayOutput(data) {
    const f = (v) => parseFloat(v).toFixed(4);
    const b = document.getElementById('biasTxt');
    
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic leading-none text-center mb-8 ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById('eVal').innerText = f(data.entry);
    document.getElementById('sVal').innerText = f(data.sl);
    document.getElementById('tVal').innerText = f(data.tp);

    // Dynamic Lot Calculation
    const riskAmt = Math.abs(data.entry - data.sl);
    const balance = parseFloat
