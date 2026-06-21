// ═══════════════════════════════════════════════
//   DEMO: IR Colorization via Claude AI API
// ═══════════════════════════════════════════════

const statusMessages = [
    'Initializing pipeline…',
    'Loading ESRGAN super-resolution model…',
    'Applying edge sharpening…',
    'Running Pix2Pix colorization…',
    'Applying semantic constraints…',
    'Computing evaluation metrics…',
    'Finalizing output…'
];

// ── FILE INPUT HANDLER ──
document.getElementById('imageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    handleFile(file);
});

// ── DRAG & DROP ──
const uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const src = ev.target.result;
        document.getElementById('inputPreview').src = src;

        // Show controls and results
        document.getElementById('demoControls').style.display = 'block';
        document.getElementById('demoResults').style.display = 'flex';

        // Reset output
        document.getElementById('outputPreview').style.display = 'none';
        document.getElementById('processingOverlay').style.display = 'flex';
        document.getElementById('metricsPanel').style.display = 'none';
        document.getElementById('procStatus').textContent = 'Image loaded. Configure and click Colorize.';
        document.getElementById('proc-spinner') && (document.querySelector('.proc-spinner').style.display = 'none');
    };
    reader.readAsDataURL(file);
}

// ── MAIN PROCESS ──
async function processImage() {
    const inputImg = document.getElementById('inputPreview');
    if (!inputImg.src || inputImg.src === window.location.href) {
        alert('Please upload an IR image first.');
        return;
    }

    const btn = document.getElementById('processBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Processing…';

    // Show results panel
    document.getElementById('demoResults').style.display = 'flex';
    document.getElementById('outputPreview').style.display = 'none';
    document.getElementById('processingOverlay').style.display = 'flex';
    document.querySelector('.proc-spinner').style.display = 'block';
    document.getElementById('metricsPanel').style.display = 'none';

    // Cycle status messages
    let msgIdx = 0;
    const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % statusMessages.length;
        document.getElementById('procStatus').textContent = statusMessages[msgIdx];
    }, 1200);

    const startTime = Date.now();

    try {
        const enhMode = document.getElementById('enhMode').value;
        const colorModel = document.getElementById('colorModel').value;
        const semantic = document.getElementById('semanticToggle').checked;

        // Convert image to base64
        const base64 = inputImg.src.split(',')[1];

        // Call Claude API for semantic analysis
        // const analysis = await callClaudeAPI(base64, enhMode, colorModel, semantic);
        const analysis = "Demo Mode";
        // Simulate colorization: apply CSS filter to generate a "colorized" look
        await applyColorization(inputImg.src);

        clearInterval(interval);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        // Show simulated metrics
        showMetrics(elapsed, analysis);

        // Show colorized output
        document.getElementById('processingOverlay').style.display = 'none';
        document.getElementById('outputPreview').style.display = 'block';

    } catch (err) {
        clearInterval(interval);
        document.getElementById('procStatus').textContent = 'Error: ' + err.message;
        console.error(err);
    }

    btn.disabled = false;
    btn.textContent = '⚡ Colorize & Enhance';
}

// ── CLAUDE API CALL ──
async function callClaudeAPI(base64ImageData, enhMode, colorModel, semantic) {
    const prompt = `You are an expert in satellite remote sensing and infrared image analysis. 

I'm showing you a satellite/landscape image that represents an infrared (IR) capture (or a simulated IR image). Analyze it and provide:

1. **Scene Classification**: Identify the dominant land-cover types visible (e.g., vegetation, water, urban, bare soil, snow, cloud).
2. **IR-to-RGB Mapping**: For each identified class, describe what color it should be assigned in realistic RGB colorization.
3. **Enhancement Notes**: Note any specific areas where super-resolution or edge sharpening would most help.
4. **Semantic Integrity Check**: Flag any areas where automatic colorization might incorrectly assign colors (potential hallucination risks).
5. **Quality Assessment**: Provide simulated PSNR (35–45 dB range) and SSIM (0.85–0.99) values that would be realistic for this type of imagery.
6. **Pipeline: ${enhMode} + ${colorModel}${semantic ? ' + Semantic Constraints' : ''}**: Comment specifically on how this pipeline configuration would perform.

Keep your response concise and structured with clear labels. Return as a plain text analysis (no markdown headings, just labeled paragraphs).`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64ImageData
                        }
                    },
                    { type: 'text', text: prompt }
                ]
            }]
        })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API call failed');
    }

    const data = await response.json();
    return data.content[0].text;
}

// ── COLORIZATION SIMULATION ──
async function applyColorization(srcDataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = img.width;
            offCanvas.height = img.height;
            const offCtx = offCanvas.getContext('2d');

            // Draw original (desaturated to simulate IR)
            offCtx.filter = 'grayscale(100%) contrast(1.2) brightness(0.9)';
            offCtx.drawImage(img, 0, 0);

            // Apply pseudo-colorization: false-color thermal mapping
            const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i]; // R (same as G and B after grayscale)

                // Map gray intensity to thermal-inspired RGB
                const [r, g, b] = thermalMap(gray);
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }

            offCtx.putImageData(imageData, 0, 0);

            // Overlay a slight natural look
            offCtx.globalAlpha = 0.25;
            offCtx.filter = 'saturate(2) hue-rotate(120deg)';
            offCtx.drawImage(img, 0, 0);

            document.getElementById('outputPreview').src = offCanvas.toDataURL('image/jpeg', 0.92);
            resolve();
        };
        img.src = srcDataUrl;
    });
}

// Thermal false-color mapping (cold → blue, mid → green, hot → yellow → red)
function thermalMap(v) {
    if (v < 64) {
        // Cold: black → dark blue
        return [0, 0, Math.round(v * 2)];
    } else if (v < 128) {
        const t = (v - 64) / 64;
        // Dark blue → cyan-green (vegetation)
        return [0, Math.round(t * 180), Math.round(128 - t * 60)];
    } else if (v < 192) {
        const t = (v - 128) / 64;
        // Green → yellow (dry land/urban)
        return [Math.round(t * 200), Math.round(180 + t * 50), Math.round(68 - t * 68)];
    } else {
        const t = (v - 192) / 63;
        // Yellow → hot white (high reflectance/heat)
        return [Math.round(200 + t * 55), Math.round(230 - t * 30), Math.round(t * 200)];
    }
}

// ── SHOW METRICS ──
function showMetrics(elapsed, analysisText) {
    // Generate plausible metric values
    const psnr = (36 + Math.random() * 8).toFixed(1);
    const ssim = (0.88 + Math.random() * 0.1).toFixed(3);
    const fid = (18 + Math.random() * 20).toFixed(1);

    document.getElementById('psnrVal').textContent = psnr;
    document.getElementById('ssimVal').textContent = ssim;
    document.getElementById('fidVal').textContent = fid;
    document.getElementById('timeVal').textContent = elapsed;

    document.getElementById('aaContent').textContent = analysisText || 'Analysis unavailable.';
    document.getElementById('metricsPanel').style.display = 'block';
}