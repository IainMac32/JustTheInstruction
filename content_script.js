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

// Tokenize input using vocab
function tokenize(text, maxLen = 100) {
  const oovTokenId = vocab["<OOV>"] || 1;
  const words = text.toLowerCase().split(/\s+/);
  const tokenIds = words
    .map((word) => vocab[word])
    .filter((id) => id !== undefined && id >= -10000 && id <= 9999);

  const padded = new Float32Array(maxLen).fill(0);
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
  for (const sentence of sentences) {
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
    total += scores[0] || 0; // Instruction class confidence
  }
  return total / sentences.length;
}

// Build floating UI
function createFloatingUI(pageTitle) {
  const url = window.location.href;
  if (floatingUI && currentPageUrl === url) return floatingUI;

  if (floatingUI?.parentElement) {
    floatingUI.parentElement.removeChild(floatingUI);
    floatingUI = null;
  }

  currentPageUrl = url;
  floatingUI = document.createElement("div");
  floatingUI.id = "instructions-floating-ui";

  const shadow = floatingUI.attachShadow({ mode: "closed" });

  const styles = document.createElement("style");
  styles.textContent = `/* your style block remains unchanged */`;
  shadow.appendChild(styles);

  const container = document.createElement("div");
  container.innerHTML = `
    <div id="floating-container" class="animate-slide-in">
      <div class="header">
        <h2>Just the Instructions</h2>
        <button id="close-btn">×</button>
      </div>
      <div class="subtitle">Analyzing: <strong>${pageTitle}</strong></div>
      <div class="content">
        <div id="loading-indicator" style="display: none;">
          <div class="spinner"></div>
          <p>Extracting instructions...</p>
        </div>
        <div id="instructions-text"></div>
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

// Extract visible text and show probability
async function extractInstructions() {
  console.log("Extracting instructions...");
  const pageTitle = document.title || window.location.href;
  const elements = document.querySelectorAll(
    "h1, h2, h3, h4, h5, p, li, td, caption, a"
  );
  const puretext = Array.from(elements)
    .map((el) => el.textContent)
    .join(" ");

  const shadow = createFloatingUI(pageTitle);
  const loading = shadow.querySelector("#loading-indicator");
  const output = shadow.querySelector("#instructions-text");

  loading.style.display = "block";
  output.style.display = "none";
  try {
    console.log("[Content] Running model on text length:", puretext.length);
    const sampleInstructionsInput =
      "Cookies are a beloved treat enjoyed across cultures and generations. The origin of the chocolate chip cookie dates back to the 1930s, when Ruth Wakefield accidentally created the recipe at the Toll House Inn. While baking techniques have evolved, the comfort provided by a warm cookie remains timeless. Many believe the texture and flavor of cookies can stir up powerful childhood memories. Whether soft and chewy or crisp and delicate, cookies are a staple in dessert menus around the world.";
    const probability = await runLocalModel(sampleInstructionsInput);
    console.log("[Content] Model returned probability:", probability);
    loading.style.display = "none";
    output.style.display = "block";
    output.textContent = `Instruction Probability: ${probability.toFixed(4)}`;
  } catch (error) {
    console.error("[Content] Error during model run:", error);
    console.error("[Content] Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    loading.style.display = "none";
    output.textContent =
      "Error running model. Please check console for details.";
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
  }
  return true; // Important for async response
});
