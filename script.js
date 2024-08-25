const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let previousX = null;
let previousY = null;

// Function to set up the camera
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Function to start the hand pose model
async function startHandPose() {
    const model = await handpose.load();
    console.log("HandPose model loaded.");
    detectHand(model);
}

// Function to detect hands and draw on canvas
async function detectHand(model) {
    video.width = window.innerWidth;
    video.height = window.innerHeight;
    canvas.width = video.width;
    canvas.height = video.height;

    async function detect() {
        const predictions = await model.estimateHands(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks;

            // Get positions of index finger tip and thumb tip
            const [x1, y1] = landmarks[8];  // Index finger tip
            const [x2, y2] = landmarks[4];  // Thumb tip

            // Calculate distance between index finger tip and thumb tip
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

            // If the distance is below a certain threshold, start drawing
            if (distance < 40) {
                isDrawing = true;
            } else {
                isDrawing = false;
                previousX = null;
                previousY = null;
            }

            // Draw a small circle at each fingertip
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(x1, y1, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
            ctx.fill();

            // Draw line if drawing is active
            if (isDrawing) {
                if (previousX !== null && previousY !== null) {
                    ctx.strokeStyle = "blue";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(previousX, previousY);
                    ctx.lineTo(x1, y1);
                    ctx.stroke();
                }
                previousX = x1;
                previousY = y1;
            }
        }
        requestAnimationFrame(detect);
    }
    detect();
}

// Initialize camera and model
setupCamera().then(startHandPose);
