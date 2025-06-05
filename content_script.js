// Content script for floating UI and text extraction
let floatingUI = null;

// Function to create the floating UI
function createFloatingUI() {
  if (floatingUI) return; // Prevent multiple instances

  floatingUI = document.createElement("div");
  floatingUI.id = "instructions-floating-ui"; // Add Tailwind styles
  const styles = document.createElement("link");
  styles.rel = "stylesheet";
  styles.href = chrome.runtime.getURL("dist/styles.css");
  document.head.appendChild(styles);

  // Create animation keyframes
  const keyframes = document.createElement("style");
  keyframes.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(keyframes);

  floatingUI.innerHTML = `
    <div class="fixed top-5 right-5 w-[400px] max-h-[600px] bg-white rounded-lg shadow-xl z-[2147483647] font-sans overflow-hidden transition-all duration-300 animate-[slideIn_0.3s_ease-out]">
      <div class="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200 cursor-move">
        <h2 class="m-0 text-base font-medium text-gray-900">Instructions</h2>
        <button class="bg-transparent border-none text-2xl text-gray-500 hover:text-gray-900 cursor-pointer px-1">×</button>
      </div>
      <div class="p-4 overflow-y-auto max-h-[500px]">
        <div id="loading-indicator" class="text-center p-5 hidden">
          <div class="w-6 h-6 border-3 border-gray-200 border-t-blue-500 rounded-full mx-auto mb-3 animate-[spin_1s_linear_infinite]"></div>
          <p class="text-gray-600">Extracting instructions...</p>
        </div>
        <div id="instructions-text" class="text-sm leading-relaxed text-gray-700"></div>
      </div>
    </div>
  `;

  document.head.appendChild(styles);
  document.body.appendChild(floatingUI);

  // Make it draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const header = floatingUI.querySelector(".instructions-header");

  header.addEventListener("mousedown", dragStart);
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === header) {
      isDragging = true;
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      floatingUI.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }

  // Add close button handler
  floatingUI.querySelector(".close-button").addEventListener("click", () => {
    floatingUI.remove();
    floatingUI = null;
  });

  return floatingUI;
}

// Extract and process text
async function extractInstructions() {
  const textElements = document.querySelectorAll(
    "h1, h2, h3, h4, h5, p, li, td, caption, a"
  );
  let puretext = "";

  for (let i = 0; i < textElements.length; i++) {
    puretext += textElements[i].textContent + " ";
  }

  const ui = createFloatingUI();
  const loadingIndicator = ui.querySelector("#loading-indicator");
  const instructionsText = ui.querySelector("#instructions-text");

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
