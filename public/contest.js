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
const section_container = document.getElementById("section_container")

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
        let curRound = generateRound(curTest);
        while (section_container.hasChildNodes()) {
            section_container.removeChild(section_container.firstChild);
        }
        section_container.appendChild(curRound);
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
        prevAnswerElems[parseInt(qNum) - 1].textContent = qData;
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


let questionElems = [],
    inputElems = [],
    buttonElems = [],
    prevAnswerElems = []



function generateRound(questions) {

    let tSection = document.createElement("section");
    tSection.classList = "clean-block features";
    let tContainer = document.createElement("div");
    tContainer.classList = "container";
    tSection.appendChild(tContainer);
    let tHeading = document.createElement("div");
    tHeading.classList = "block-heading";
    let tHeadingTitle = document.createElement("h2");
    tHeadingTitle.classList = "text-info";
    tHeadingTitle.textContent = "Team Round";
    let tHeadingParagraph = document.createElement("p");
    tHeadingParagraph.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quam urna, dignissim nec auctor in, mattis vitae leo."
    tHeading.appendChild(tHeadingTitle);
    tHeading.appendChild(tHeadingParagraph);
    tContainer.appendChild(tHeading);
    let tQLDiv = document.createElement("div");
    for (let i = 0; i < questions.length; i++) {
        let tDiv = document.createElement("div");
        tDiv.classList = "row mb-4 mt-4";
        let qNumDiv = document.createElement("div");
        qNumDiv.classList = "col col-1";
        let qNum = document.createElement("h3");
        qNum.textContent = `${i + 1}`;
        qNumDiv.appendChild(qNum);
        tDiv.appendChild(qNumDiv);
        let questionFieldDiv = document.createElement("div");
        questionFieldDiv.classList = "col";
        let bubbleDiv = document.createElement("div");
        let tQuestion = document.createElement("p");
        tQuestion.textContent = questions[i];
        bubbleDiv.appendChild(tQuestion);
        let rowDiv = document.createElement("div");
        rowDiv.classList = "row";
        let questionField = document.createElement("div");
        questionField.classList = "col col-8";
        let questionFieldRow = document.createElement("div");
        questionFieldRow.classList = "row";
        let inputCol = document.createElement("div");
        inputCol.classList = "col";
        let tInput = document.createElement("input");
        tInput.type = "text";
        inputElems.push(tInput);
        inputCol.appendChild(tInput);
        questionFieldRow.appendChild(inputCol);
        let buttonCol = document.createElement("div");
        buttonCol.classList = "col";
        let tButton = document.createElement("button");
        tButton.classList = "btn btn-primary";
        tButton.type = "button";
        tButton.textContent = "Submit"
        buttonElems.push(tButton);
        buttonCol.appendChild(tButton);
        questionFieldRow.appendChild(buttonCol);
        questionField.appendChild(questionFieldRow);
        rowDiv.appendChild(questionField)
        let prevAnsDiv = document.createElement("div");
        prevAnsDiv.classList = "col";
        let ansHeading = document.createElement("h6");
        ansHeading.textContent = "Submitted: ";
        let prevAns = document.createElement("strong");
        prevAns.textContent = "N/A"
        prevAnswerElems.push(prevAns);
        ansHeading.appendChild(prevAns);
        prevAnsDiv.append(ansHeading);
        rowDiv.appendChild(prevAnsDiv);
        bubbleDiv.appendChild(rowDiv)
        questionFieldDiv.appendChild(bubbleDiv);
        tDiv.appendChild(questionFieldDiv);
        tQLDiv.appendChild(tDiv);
        tButton.addEventListener("click", () => {
            let curVal = tInput.value;
            if (curVal != "") {
                userQuestionSubmit(i + 1, curVal);
            }
        })
    }

    tContainer.appendChild(tQLDiv);
    return tSection;
}