let floatingUI = null;
let currentPageUrl = null;
let modelSession = null;
let vocab = null;

async function loadVocab() {
  if (!vocab) {
    const vocabPath = chrome.runtime.getURL("vocab.json");
    const response = await fetch(vocabPath);
    vocab = await response.json();
  }
}

function tokenize(text, maxLen = 100) {
  const oovTokenId = vocab["<OOV>"] || 1;
  const words = text.toLowerCase().split(/\s+/);

  const tokenIds = words.map((word) => {
    let id = vocab[word] ?? oovTokenId;
    return Math.max(-10000, Math.min(9999, id)); // ✅ safe clamp
  });

  const padded = new Int32Array(maxLen).fill(0);
  tokenIds.slice(0, maxLen).forEach((id, i) => (padded[i] = id));
  return padded;
}

async function loadModel() {
  if (!modelSession) {
    try {
      console.log("[Content] Setting up ONNX runtime...");

      // ✅ Force it to use non-threaded, non-JSEP backend
      ort.env.wasm.wasmPaths = {
        "ort-wasm.wasm": chrome.runtime.getURL("ort-backend/ort-wasm.wasm"),
        "ort-wasm-simd.wasm": chrome.runtime.getURL(
          "ort-backend/ort-wasm-simd.wasm"
        ),
      };

      ort.env.wasm.simd = true;

      // ❌ Do NOT set ort.env.wasm.numThreads
      // ❌ Do NOT include ort-wasm-simd-threaded.* or jsep files anywhere

      const modelOptions = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
        executionMode: "sequential", // Not parallel, to avoid threading paths
      };

      const modelPath = chrome.runtime.getURL("model.onnx");
      modelSession = await ort.InferenceSession.create(modelPath, modelOptions);
      console.log("[Content] ONNX model loaded successfully");
    } catch (error) {
      console.error("[Content] Error loading ONNX model:", error);
      console.error("[Content] Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw error;
    }
  }
}

// Preprocess helpers
function splitIntoSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)
    .map((s) => s.trim());
}

function preprocess(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Run ONNX model on input text
async function runLocalModel(text) {
  await loadModel();
  await loadVocab();

  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return 0;

  let total = 0;
  let validCount = 0;
  for (const sentence of sentences) {
    try {
      console.log("[Content] Processing sentence:", sentence);
      const tokenIds = tokenize(sentence);

      // Use Int32Array since we're working with token IDs
      const inputData = Float32Array.from(tokenIds);
      const inputTensor = new ort.Tensor("float32", inputData, [1, 100]);
      const feeds = { input: inputTensor };

      const results = await modelSession.run(feeds);
      const output = results[Object.keys(results)[0]];
      const scores = Array.from(output.data);
      console.log("[Content] Output scores:", scores);
      validCount++;
      total += scores[0] || 0; // Instruction class confidence
    } catch (err) {
      console.warn("[Content] Error processing sentence:", sentence);
      console.warn(err);
    }
  }
  return validCount > 0 ? total / validCount : 0;
}

function createFloatingUI(pageTitle) {
  console.log("[Content] Creating floating UI...");
  const url = window.location.href;
  if (floatingUI && currentPageUrl === url) return floatingUI;

  if (floatingUI?.parentElement) {
    floatingUI.parentElement.removeChild(floatingUI);
    floatingUI = null;
  }

  currentPageUrl = url;
  floatingUI = document.createElement("div");
  floatingUI.id = "instructions-floating-ui";
  floatingUI.style.zIndex = "2147483647";

  const shadow = floatingUI.attachShadow({ mode: "open" });

  // ✅ Inject Tailwind CSS
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = chrome.runtime.getURL("dist/styles.css");
  shadow.appendChild(styleLink);

  const container = document.createElement("div");
  container.innerHTML = `
    <div id="floating-container" class="fixed top-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-4xl bg-white p-6 rounded-xl shadow-xl border font-sans z-[2147483647] max-h-[80vh] overflow-y-auto animate-slide-in">
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-xl font-semibold">Just the Instructions</h2>
        <button id="close-btn" class="text-gray-600 hover:text-black text-2xl">&times;</button>
      </div>
      <div class="text-sm text-gray-700 mb-1">
        <span class="text-gray-500">Analyzing:</span> <strong>${pageTitle}</strong>
      </div>
      <div id="average-score" class="text-sm font-medium text-blue-600 mb-4">
        <!-- Populated after model runs -->
      </div>
      <div class="text-sm text-gray-500">
        <div id="loading-indicator" class="flex items-center gap-2" style="display: none;">
          <div class="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
          <p>Extracting instructions...</p>
        </div>
        <div id="instructions-text" class="text-black whitespace-pre-line"></div>
        <button id="refresh-analysis" class="text-blue-600 underline hover:text-blue-800 text-sm mt-2">
    🔄 Refresh Analysis
  </button>
      </div>
    </div>
  `;
  shadow.appendChild(container);
  document.body.appendChild(floatingUI);

  shadow.querySelector("#close-btn").addEventListener("click", () => {
    if (floatingUI?.parentElement) {
      floatingUI.parentElement.removeChild(floatingUI);
      floatingUI = null;
    }
  });

  return shadow;
}
async function extractInstructions(toggleVisible = true, skipNotify = false) {
  const pageTitle = document.title || window.location.href;
  const currentUrl = window.location.href;

  if (
    currentUrl === "https://www.google.com/" ||
    currentUrl === "chrome://newtab/" ||
    currentUrl === "about:blank"
  ) {
    console.log("[Content] Skipping non-content page:", currentUrl);
    return;
  }

  const elements = document.querySelectorAll("p, li, td, h1, h2, h3, h4, h5");

  // ⛔ Only create/show the floating UI if requested
  let shadow = null;
  if (toggleVisible) {
    shadow = createFloatingUI(pageTitle);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  const loading = shadow?.querySelector("#loading-indicator");
  const output = shadow?.querySelector("#instructions-text");
  const scoreLabel = shadow?.querySelector("#average-score");

  if (loading) loading.style.display = "block";
  if (output) output.style.display = "none";
  if (output) output.innerHTML = "";
  if (scoreLabel) scoreLabel.textContent = "";

  let instructionElements = 0;
  let totalElements = 0;
  let instructionScores = [];
  let matchedBlocks = [];

  const isValidText = (text) => {
    const alphaRatio = text.replace(/[^a-zA-Z0-9 ]/g, "").length / text.length;
    return (
      text.length >= 20 &&
      /[a-zA-Z]/.test(text) &&
      /\s/.test(text) &&
      alphaRatio >= 0.7
    );
  };

  try {
    for (const el of elements) {
      const rawText = el.textContent.trim();
      if (!isValidText(rawText)) continue;

      totalElements++;
      const score = await runLocalModel(rawText);

      if (score >= 0.1) {
        instructionElements++;
        instructionScores.push(score);
        matchedBlocks.push({ text: rawText, confidence: score });
      }

      console.log(
        `[Content] Element: "${rawText.slice(
          0,
          60
        )}..." — Score: ${score.toFixed(3)}`
      );
    }

    if (loading) loading.style.display = "none";
    if (output) output.style.display = "block";

    const hitRate = instructionElements / totalElements;
    const avgConfidence =
      instructionScores.length > 0
        ? instructionScores.reduce((a, b) => a + b, 0) /
          instructionScores.length
        : 0;

    let header = "";
    let instructionTier = "none";

    if (instructionElements >= 15 && hitRate >= 0.2 && avgConfidence >= 0.45) {
      header = "✅ Strong Instructional Content Detected";
      instructionTier = "strong";
    } else if (
      instructionElements >= 5 &&
      ((hitRate >= 0.1 && avgConfidence >= 0.35) ||
        (hitRate >= 0.14 && avgConfidence >= 0.25))
    ) {
      header = "⚠️ Possible Instructions Found";
      instructionTier = "moderate";
    } else {
      header = "❌ No Instructional Content Detected";
    }
    // 🧠 Save summary to storage for later reuse
    chrome.storage.local.set({
      [`instruction_summary_${currentUrl}`]: {
        tier: instructionTier,
        hitRate: (hitRate * 100).toFixed(1),
        avgConfidence: (avgConfidence * 100).toFixed(1),
        matched: instructionElements,
        total: totalElements,
      },
    });

    if (!skipNotify) {
      chrome.runtime.sendMessage({
        action: "instructionAnalysis",
        tier: instructionTier,
      });
    } else {
      // Optional: mark as "refreshed" to suppress badge flash etc.
      chrome.runtime.sendMessage({
        action: "instructionAnalysis",
        tier: "refreshed", // <-- special tier for silent updates
      });
    }

    if (toggleVisible) {
      scoreLabel.textContent = `${header}
→ ${instructionElements} of ${totalElements} elements matched (${(
        hitRate * 100
      ).toFixed(1)}%)
→ Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`;

      if (matchedBlocks.length === 0) {
        output.textContent = "No instruction-like content found on this page.";
      } else {
        matchedBlocks.sort((a, b) => b.confidence - a.confidence);
        matchedBlocks.forEach(({ text, confidence }) => {
          const block = document.createElement("div");
          block.className = "mb-3";
          block.innerHTML = `
            <p class="text-sm text-gray-800 leading-snug">${text}</p>
            <p class="text-xs text-gray-500 italic">Confidence: ${(
              confidence * 100
            ).toFixed(2)}%</p>
          `;
          output.appendChild(block);
        });
      }
    }
  } catch (error) {
    console.error("[Content] Error during model run:", error);
    if (loading) loading.style.display = "none";
    if (output)
      output.textContent =
        "❌ Error during model run. See console for details.";
  }
}
async function toggleFloatingUI() {
  const pageTitle = document.title || window.location.href;
  const currentUrl = window.location.href;
  const shadow = createFloatingUI(pageTitle); // still needed to inject shell

  const { [`instruction_summary_${currentUrl}`]: summary } =
    await chrome.storage.local.get([`instruction_summary_${currentUrl}`]);

  if (!summary) return;

  const { tier, hitRate, avgConfidence, matched, total } = summary;
  const scoreLabel = shadow.querySelector("#average-score");
  const output = shadow.querySelector("#instructions-text");

  if (scoreLabel) {
    let color =
      tier === "strong"
        ? "text-green-600"
        : tier === "moderate"
        ? "text-yellow-600"
        : "text-red-600";

    scoreLabel.innerHTML = `
      <span class="${color} font-semibold block mb-1">
        ${
          tier === "strong"
            ? "✅ Strong Instructions"
            : tier === "moderate"
            ? "⚠️ Some Instructions"
            : "❌ No Instructions"
        }
      </span>
      → ${matched} of ${total} elements matched (${hitRate}%)
      <br>
      → Avg Confidence: ${avgConfidence}%`;
  }

  if (output) {
    output.innerHTML = "";
  }

  const refreshBtn = shadow.querySelector("#refresh-analysis");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      extractInstructions(true, true); // rerun & replace
      toggleFloatingUI(); // re-show UI
    };
  }
}

// Handle messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Content] Received message:", request.action);

  if (request.action === "copyText") {
    console.log("[Content] Extracting instructions...");
    extractInstructions();
    sendResponse(true);
  } else if (request.action === "getPageText") {
    console.log("[Content] Getting page text...");
    const elements = document.querySelectorAll(
      "h1, h2, h3, h4, h5, p, li, td, caption, a"
    );
    const text = Array.from(elements)
      .map((el) => el.textContent)
      .join(" ");
    console.log("[Content] Got text, length:", text.length);
    sendResponse(text);
  } else if (request.action === "toggleFloatingUI") {
    console.log("[Content] Toggling floating UI...");
    toggleFloatingUI();
    sendResponse(true);
  } else if (request.action === "extractInstructions") {
    console.log("[Content] Extracting instructions with UI toggle...");
    extractInstructions(false);
    sendResponse(true);
  }
  return true; // Important for async response
});
