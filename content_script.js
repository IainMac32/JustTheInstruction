// content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyText') {
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, p, li, td, caption, a'); //maybe add span back
        let puretext = "";


        for (let i = 0; i < textElements.length; i++) {
            puretext += textElements[i].textContent + " ";  // Adding a space between elements for readability
        }
        console.log(puretext);


        // Send puretext to Python script
        fetch('https://my-flask-app-3gu632umxq-nn.a.run.app/receive_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: puretext })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success!!:', data["text_received"]);
           
            // Send the received data back to the popup
            chrome.runtime.sendMessage({ action: 'showText', text: data["text_received"] });
        })
        .catch(error => console.error('Error!!:', error));
    }
});
