
//If you are seeing this as a contestant, just dont.
let ws;
if (prompt("pw") === "avocado") { connect() }

async function connect() {
    //const loc = "ws://localhost:3000/"
    const loc = "ws://jrhighmath2021.azurewebsites.net/contest";
    function init() {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
        }

        ws = new WebSocket(loc);

        ws.onopen = () => {
            console.log('Socket connection opened');
        }
        ws.onmessage = (data) => {

        }
        ws.onclose = () => {
            ws = null;
        }
    }


    init();
    return ws;
}

function start(num) {
    alert(`Started ${num}`);
    ws.send(num);
}
