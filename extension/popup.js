document.getElementById('circle-button').addEventListener('click', () => {
    // Show the loading screen
    document.getElementById('button-screen').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'block';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'copyText' });
    });
});

// Listen for messages from content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'showText') {
        // Update the text in the second screen
        document.getElementById('received-text').textContent = request.text;
       
        // Hide the loading screen and switch to the text screen
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('text-screen').style.display = 'block';
    }
});

// Handle the back button to go back to the first screen
document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('text-screen').style.display = 'none';
    document.getElementById('button-screen').style.display = 'block';
});
