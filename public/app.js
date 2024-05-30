const SERVER_URL = "http://localhost:8080";

document.addEventListener('DOMContentLoaded', function () {
    const video = document.getElementById('video');
    const detectorContainer = document.getElementById('detector');
    detectorContainer.innerHTML = "Monitoring";

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                video.srcObject = stream;
                video.addEventListener('playing', personDetect);
            })
            .catch(error => {
                console.error("Error accessing the camera:", error);
            });
    }
});

function personDetect() {
    console.log("person detected");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");

    setTimeout(() => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => sendBlobSync(blob, `${SERVER_URL}/person-detect`, handlePersonDetectionResponse));
    }, 100);
}

function analyzePerson() {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const analysisParagraph = document.createElement('p');
    const reasonContainer = document.getElementById('reason');
    reasonContainer.appendChild(analysisParagraph);

    canvas.toBlob(blob => sendBlobAsync(blob, `${SERVER_URL}/analyze`, handlePersonAnalysis, analysisParagraph));
}

function sendBlobSync(blob, url, callback) {
    const formData = new FormData();
    formData.append('image', blob, 'frame.png');

    fetch(url, {
        method: 'POST',
        body: formData,
    })
        .then(response => response.text())
        .then(text => callback(text))
        .catch(error => console.error('Error analyzing the image:', error));
}

function sendBlobAsync(blob, url, callback, paragraph, responseParameter = null) {
    let remainingData = '';
    const formData = new FormData();
    formData.append('image', blob, 'frame.png');
    if(responseParameter) {
        formData.append('response', responseParameter);
    }
    fetch(url, {
        method: 'POST',
        body: formData,
    })
        .then(async response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            reader.read().then(function processText({ done, value }) {
                if (done) {
                    callback();
                    return;
                }
                const textChunk = decoder.decode(value, { stream: true });
                remainingData += textChunk;  // Add new text chunk to any remaining data from previous read
                remainingData = processStreamData(remainingData, paragraph);  // Process data and update remaining data
                return reader.read().then(processText);
            });
        })
        .catch(error => {
            console.error('Error analyzing the image:', error);
        });
}

function handlePersonDetectionResponse(responseText) {
    if (responseText.trim().toLowerCase() === 'yes') {
        document.getElementById('detector').innerHTML = "Person detected";
        document.getElementById('video').pause();
        const analysisContainer = document.getElementById('analysis');
        const analysisParagraph = document.createElement('p');
        analysisContainer.appendChild(analysisParagraph);
        displayInteractiveMessage(
            analysisParagraph,
            "An intruder has been detected. Does this person look suspicious? Should I open fire or stand down?",
            analyzePerson
        );
    } else {
        setTimeout(personDetect, 0);
    }
}

function displayInteractiveMessage(paragraph, message, callback) {
    let index = 0;
    const intervalId = setInterval(() => {
        if (index < message.length) {
            paragraph.innerHTML += message[index] === '<' ? handleSpecialCharacters(message, index) : message[index];
            index += (message[index] === '<' ? message.indexOf('>', index) - index + 1 : 1);
        } else {
            clearInterval(intervalId);
            callback();
        }
    }, 10);
}

function handlePersonAnalysis() {
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const video = document.getElementById('video');
    const reasonContainer = document.getElementById('reason');
    const reasonParagraph = document.createElement('p');

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    reasonContainer.appendChild(reasonParagraph);
    const analysisParagraph = document.getElementById('reason').firstElementChild;
    const response = analysisParagraph.textContent.split(" ").slice(-2).join(" ");

    const backgroundElement = document.getElementsByClassName("background");
    if (backgroundElement) {
        if (response === "Stand down") {
            backgroundElement[0].style.background = "rgb(215, 215, 215)";
        } else {
            backgroundElement[0].style.background = "red";
        }
    }
    canvas.toBlob(blob => sendBlobAsync(blob, `${SERVER_URL}/analyze-with-response`, handleReason, reasonParagraph, response));
}

function handleReason() {
    let countdown = 10;
    const detectorContainer = document.getElementById('detector');
    const countdownInterval = setInterval(() => {
        detectorContainer.innerHTML = `Resetting in ${countdown}`
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
            location.reload(); // Reset the application to its initial state
        }
    }, 1000);
}

function processStreamData(data, paragraph) {
    let processedIndex = 0;
    let braceDepth = 0;
    let isInString = false;
    let escapeNext = false;

    for (let i = 0; i < data.length; i++) {
        const char = data[i];

        if (isInString && char === '\\' && !escapeNext) {
            escapeNext = true; // Next character is escaped
            continue;
        }

        if (escapeNext) {
            escapeNext = false; // The current character is escaped, skip further processing
            continue;
        }

        if (char === '"') {
            // If we encounter a quote and it is not escaped, toggle isInString
            isInString = !isInString;
        }

        // Only attempt to detect braces if we're not within a string
        if (!isInString) {
            if (char === '{') {
                braceDepth++;
            } else if (char === '}') {
                braceDepth--;
                if (braceDepth === 0) {
                    let jsonString = data.substring(processedIndex, i + 1).trim();
                    try {
                        if (jsonString.startsWith("data: ")) {
                            jsonString = jsonString.substring(6).trim();
                        }
                        const jsonObj = JSON.parse(jsonString);
                        displayMessage(jsonObj, paragraph);  // Display the parsed message
                    } catch (e) {
                        console.error('Error parsing JSON:', e, 'with data:', jsonString);
                    }
                    processedIndex = i + 1; // Update the index to the end of the processed JSON object
                }
            }
        } else {
            // We are within a string, so ignore braces
        }
    }

    return data.substring(processedIndex);
}

function displayMessage(jsonObj, container) {
    if (jsonObj.message && jsonObj.message.content) {
        container.textContent += jsonObj.message.content; // Display the content
    }
    if (jsonObj.content && jsonObj.content != "</s>") {
        container.textContent += jsonObj.content; // Display the content
    }
}

