/** * OMNI—DUAL NEURAL CORE V62.6
 * FIX: Recursive Compression Layer for API Rejection
 */

var files = [null, null, null, null];

function injectGallery(i) { document.getElementById(`f${i}`).click(); }

function handleFile(i) {
    const f = document.getElementById(`f${i}`).files[0];
    if(!f) return;
    files[i] = f;
    const r = new FileReader();
    r.onload = (e) => {
        const img = document.getElementById(`p${i}`);
        document.getElementById(`c${i}`).classList.add('active-box');
        img.src = e.target.result;
        img.classList.remove('opacity-0');
    };
    r.readAsDataURL(f);
}

async function runNeuralScan() {
    const btn = document.getElementById('goBtn');
    const isDay = document.getElementById('mode-input').checked;
    const key = localStorage.getItem('omni_k');

    btn.disabled = true;
    btn.innerText = "SQUASHING PAYLOAD...";

    try {
        // Fix for rejection: aggressively shrink images
        const dataBuffers = await Promise.all(files.map(f => f ? processImg(f, isDay) : Promise.resolve(null)));
        btn.innerText = "NEURAL HANDSHAKE...";
        
        const signal = await fetchNeuralSignal(key, dataBuffers, isDay);
        displayOutput(signal);
    } catch (err) {
        alert("CRITICAL ERROR: API REJECTED. REDUCE CHART COMPLEXITY.");
    } finally {
        btn.disabled = false;
        btn.innerText = "EXECUTE COMMAND";
    }
}

// THE FIX: Resizes and lowers JPEG quality based on mode
async function processImg(f, isDay) {
    return new Promise((resolve) => {
        const r = new FileReader();
        r.readAsDataURL(f);
        r.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const cv = document.createElement('canvas');
                // Lower max dimensions for Day Mode to fit token limits
                const maxDim = isDay ? 650 : 850; 
                const scale = maxDim / Math.max(img.width, img.height);
                cv.width = img.width * scale; cv.height = img.height * scale;
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                // Lower quality to 0.4 ensures payload stays under rejection threshold
                resolve(cv.toDataURL('image/jpeg', isDay ? 0.4 : 0.6));
            };
        };
    });
}

async function fetchNeuralSignal(key, imgs, isDay) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const prompt = `[OMNI—V6] MODE: ${isDay ? "DAY" : "SCALP"}. Analyze for SMC/ICT. Output JSON only.`;

    const parts = [{ text: prompt }];
    imgs.forEach(i => { if (i) parts.push({ inline_data: { mime_type: "image/jpeg", data: i.split(',')[1] } }); });

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: parts }] })
    });

    if (!res.ok) throw new Error("REJECTED");
    const json = await res.json();
    return JSON.parse(json.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim());
}

function displayOutput(data) {
    const b = document.getElementById('biasTxt');
    b.innerText = data.bias;
    b.className = `text-[120px] font-900 italic leading-none text-center ${data.bias === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}`;
    document.getElementById('logicLog').innerText = data.logic;
    document.getElementById('outPanel').classList.remove('hidden');
}
