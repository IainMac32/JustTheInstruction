// Animation state
let isAnimating = false;

// Function to trigger the content script
async function triggerContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "copyText" });
  } catch (error) {
    console.error("Error triggering content script:", error);
  }
}

// Function to animate the extension action and show notification
async function animateExtension(tabId, url) {
  if (isAnimating) return;
  isAnimating = true;

  try {
    // Set badge and color for pinned extension
    await chrome.notifications.create("instruction-notification", {
      type: "basic",
      iconUrl: "images/cookie.png",
      title: "Instructions Available!",
      message: "Click here to extract instructions",
      priority: 2,
      requireInteraction: false,
      silent: false,
      buttons: [],
      isClickable: true,
    });

    // Auto-dismiss notification after 5 seconds
    setTimeout(() => {
      chrome.notifications.clear("instruction-notification");
    }, 5000);
  } catch (error) {
    console.error("Error:", error);
  } finally {
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
      await triggerContentScript(tab.id);
    }
    chrome.notifications.clear(notificationId);
  }
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  await triggerContentScript(tab.id);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the page has finished loading and it's a http/https URL
  if (changeInfo.status === "complete" && tab.url?.startsWith("http")) {
    animateExtension(tabId, tab.url);
  }
});
