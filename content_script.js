const text = document.querySelectorAll('h1, h2, h3, h4, h5, p, li, td, caption, span, a');
let puretext = "";

for (let i = 0; i < text.length; i++) {
    console.log(text[i].textContent);
    puretext += text[i].textContent;  // Concatenate the text content to puretext
}

// Send puretext to Python script
fetch('http://localhost:5000/receive_text', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: puretext })
})
.then(response => response.text())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
