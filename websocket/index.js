const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
    console.log("A new client connected.");

    // Broadcast the received image data to all connected clients
    ws.on("message", (message) => {
        const data = JSON.parse(message); // Parse the incoming message

        // Ensure we're broadcasting only the relevant data (imageData)
        if (data.imageData) {
            const messageToBroadcast = JSON.stringify({
                imageData: data.imageData,
            });
            // Broadcast to all clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageToBroadcast);
                }
            });
        }
    });

    ws.on("close", () => {
        console.log("A client disconnected.");
    });

    ws.on("error", (error) => {
        console.log("WebSocket error: ", error);
    });
});

console.log("WebSocket server is running on ws://localhost:8080");
