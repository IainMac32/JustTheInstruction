import { modelService } from "./modelService.js";

// Content script for floating UI and text extraction
let floatingUI = null;
let currentPageUrl = null;

// Function to create the floating UI
function createFloatingUI(pageTitle) {
  const url = window.location.href;

  // If we already have a UI for this URL, don't create another one
  if (floatingUI && currentPageUrl === url) {
    return floatingUI;
  }

  // If we have a UI from a different URL, remove it
  if (floatingUI && floatingUI.parentElement) {
    floatingUI.parentElement.removeChild(floatingUI);
    floatingUI = null;
  }

  // Set the current URL
  currentPageUrl = url;

  // Create the host element
  floatingUI = document.createElement("div");
  floatingUI.id = "instructions-floating-ui";

  // Create a shadow root for style isolation
  const shadow = floatingUI.attachShadow({ mode: "closed" });

  // Add all styles directly within shadow DOM
  const styles = document.createElement("style");
  styles.textContent = `
    :host {
      all: initial;
      display: block;
      --bg-white: #ffffff;
      --bg-gray-50: #f9fafb;
      --text-gray-600: #4b5563;
      --text-gray-700: #374151;
      --text-gray-900: #111827;
      --border-gray-200: #e5e7eb;
      --blue-500: #3b82f6;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #floating-container {
      position: fixed;
      width: 800px;
      height: 80vh;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-white);
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 2147483647;
      overflow: hidden;
      font-size: 16px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--bg-gray-50);
      border-bottom: 1px solid var(--border-gray-200);
    }
    .header h2 {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-gray-900);
    }
    .subtitle {
      padding: 0.75rem 1.5rem;
      background: var(--bg-gray-50);
      border-bottom: 1px solid var(--border-gray-200);
      font-size: 0.875rem;
      color: var(--text-gray-600);
    }
    .content {
      padding: 1.5rem;
      height: calc(80vh - 116px);
      overflow-y: auto;
    }
    #close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--text-gray-600);
      cursor: pointer;
      padding: 0 0.25rem;
    }
    #close-btn:hover {
      color: var(--text-gray-900);
    }
    #loading-indicator {
      text-align: center;
      padding: 1.25rem;
    }
    .spinner {
      width: 2rem;
      height: 2rem;
      border: 4px solid var(--border-gray-200);
      border-top-color: var(--blue-500);
      border-radius: 50%;
      margin: 0 auto 1rem;
      animation: spin 1s linear infinite;
    }
    #instructions-text {
      font-size: 1rem;
      line-height: 1.625;
      color: var(--text-gray-700);
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translate(-50%, -55%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `;
  shadow.appendChild(styles);

  // Create the container within shadow DOM
  const container = document.createElement("div");
  container.innerHTML = `
    <div id="floating-container" class="animate-slide-in">
      <div class="header">
        <h2>Just the Instructions</h2>
        <button id="close-btn">×</button>
      </div>
      <div class="subtitle">
        Analyzing: <strong>${pageTitle}</strong>
      </div>
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

  // Add close button handler using shadow DOM
  shadow.querySelector("#close-btn").addEventListener("click", () => {
    if (floatingUI && floatingUI.parentElement) {
      floatingUI.parentElement.removeChild(floatingUI);
      floatingUI = null;
    }
  });

  return shadow;
}

// Extract and process text
async function extractInstructions() {
  const pageTitle = document.title || window.location.href;
  const textElements = document.querySelectorAll(
    "h1, h2, h3, h4, h5, p, li, td, caption, a"
  );
  let puretext = "";

  for (let i = 0; i < textElements.length; i++) {
    puretext += textElements[i].textContent + " ";
  }

  const shadow = createFloatingUI(pageTitle);
  const loadingIndicator = shadow.querySelector("#loading-indicator");
  const instructionsText = shadow.querySelector("#instructions-text");

  loadingIndicator.style.display = "block";
  instructionsText.style.display = "none";

  try {
    const response = await fetch(
      "https://my-flask-app-3gu632umxq-nn.a.run.app/receive_text",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: puretext }),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    const data = await response.json();
    loadingIndicator.style.display = "none";
    instructionsText.style.display = "block";
    instructionsText.textContent = data.text_received;
  } catch (error) {
    console.error("Error:", error);
    loadingIndicator.style.display = "none";
    instructionsText.textContent =
      "Error extracting instructions. Please try again.";
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "copyText") {
    extractInstructions();
  }
});
