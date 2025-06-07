// Animation state
let isAnimating = false;

// Function to get text from content script
async function getPageText(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "getPageText",
    });
    console.log("[Background] Got text response:", response ? "yes" : "no");
    return response;
  } catch (error) {
    console.error("[Background] Error getting page text:", error);
    return null;
  }
}

// Function to trigger the content script
async function triggerContentScript(tabId) {
  try {
    console.log("[Background] Triggering content script for tab:", tabId);
    await chrome.tabs.sendMessage(tabId, { action: "copyText" });
  } catch (error) {
    console.error("[Background] Error triggering content script:", error);
  }
}

// Function to animate the extension action and show notification
async function animateExtension(tabId, url) {
  if (isAnimating) return;
  isAnimating = true;
  console.log("[Background] Starting animation for tab:", tabId);

  try {
    // Create notification
    await chrome.notifications.create("instruction-notification", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("images/cookie.png"),
      title: "Instructions Available!",
      message: "Click to analyze this page",
      priority: 2,
      requireInteraction: false,
      silent: false,
      buttons: [],
      isClickable: true,
    });

    //Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear("instruction-notification");
    }, 5000);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    console.log("[Background] Animation complete for tab:", tabId);
    isAnimating = false;
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId === "instruction-notification") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: "toggleFloatingUI" });
    }
    chrome.notifications.clear(notificationId);
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.tabs.sendMessage(tab.id, { action: "toggleFloatingUI" });
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Check if the page has finished loading and it's a http/https URL
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    console.log("[Background] Tab updated:", tabId);
    console.log("[Background] URL:", tab.url);
    // Trigger content script to copy text
    await chrome.tabs.sendMessage(tabId, { action: "extractInstructions" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "instructionAnalysis") {
    console.log("[Background] Received instruction tier:", message.tier);

    // Only show notification if moderate or strong instructions found
    if (["moderate", "strong"].includes(message.tier)) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          animateExtension(tabs[0].id, tabs[0].url);
        }
      });
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("userId", (data) => {
    if (!data.userId) {
      const uuid = crypto.randomUUID();
      chrome.storage.local.set({ userId: uuid }, () => {
        console.log("[Extension] userId generated:", uuid);
      });
    }
  });
});
