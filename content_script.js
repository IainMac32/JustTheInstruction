chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'copyText') {
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, p, li, td, caption, a'); //maybe add span back
        let puretext = "";

        for (let i = 0; i < textElements.length; i++) {
            console.log(textElements[i].textContent); // remove to not see in console
            puretext += textElements[i].textContent + " ";  // Adding a space between elements for readability
        }


        // Send puretext to Python script
        fetch('http://localhost:5000/receive_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: puretext })
        })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
    }
});
