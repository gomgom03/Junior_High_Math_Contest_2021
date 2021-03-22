let ws;
async function connect() {
    const loc = "ws://localhost:3000/"
    function init() {
        if (ws) {
            ws.onerror = ws.onopen = ws.onclose = null;
            ws.close();
        }

        ws = new WebSocket(loc);

        ws.onopen = () => {
            console.log('Socket connection opened');
            let tEmail = localStorage.getItem("email");
            let tPw = localStorage.getItem("pw");
            tEmail == null || tPw == null ? null : loginSend(tEmail, tPw);
        }
        ws.onmessage = (data) => {
            let parsedData = JSON.parse(data.data)
            let { id, msg } = parsedData;
            switch (id) {
                case "loginResponse":
                    loginResponseHandle(msg);
                    break;
                case "userRequestStartResponse":
                    userRequestStartResponseHandle(msg);
                    break;
                case "userQuestionSubmitResponse":
                    userQuestionSubmitResponseHandle(msg);
                    break;
                case "timeWarning":
                    timeWarningResponseHandle(msg);
                    break;
                case "testEnd":
                    testEndHandle(msg);
                    break;
                default:
                    alert("Invalid Message");
            }
        }
        ws.onclose = () => {
            ws = null;
        }
    }


    init();
    return ws;
}
connect();
/*
connect().then(() => {

})
*/
let testNum = 1;

function wsSend(obj) {
    ws ? ws.send(JSON.stringify(obj)) : alert("Websocket not connected. Try refreshing your page.");
}

function loginSend(email, pw) {
    wsSend({
        id: "login",
        msg: {
            email: email,
            pw: pw
        }
    });
}

function userRequestStart() {
    let email = localStorage.getItem("email");
    let pin = localStorage.getItem("pin");
    wsSend({
        id: "userRequestStart",
        msg: {
            email: email,
            pin: pin,
            testNum: testNum
        }
    })
}

function userQuestionSubmit(qNum, qData) {
    let email = localStorage.getItem("email");
    let pin = localStorage.getItem("pin");
    wsSend({
        id: "userQuestionSubmit",
        msg: {
            email: email,
            pin: pin,
            testNum: testNum,
            qNum: qNum,
            qData: qData
        }
    })
}



function loginResponseHandle(data) {
    if (data.verify) {
        for (let x in data) {
            localStorage.setItem(x, data[x]);
        }
        alert("Login Success!")
    } else {
        alert("Invalid Login.");
    }
}

function userRequestStartResponseHandle(data) {
    if (data.verify) {
        let curTest = data.test;
        alert("User Request Start Granted!");
        console.log(curTest);
    } else {
        alert("User Request Start Denied.")
    }
}

function userQuestionSubmitResponseHandle(data) {
    let { verify, qNum, qData } = data;
    if (verify) {
        console.log(qNum, qData);
    } else {
        alert("Question submit failed. Try refreshing page")
    }
}

function testEndHandle(data) {
    let { verify } = data;
    if (data.verify) {
        alert(`Round ${testNum + 1} ended!`)
    }
}
