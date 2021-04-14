let ws;
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
            let tEmail = localStorage.getItem("email");
            let tPw = localStorage.getItem("pw");
            tEmail == null || tPw == null ? generateLogin() : loginSend(tEmail, tPw);
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
let curTestNum = 0;
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

function userRequestStart(num) {
    let email = localStorage.getItem("email");
    let pin = localStorage.getItem("pin");
    curTestNum = num;
    wsSend({
        id: "userRequestStart",
        msg: {
            email: email,
            pin: pin,
            testNum: num
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
            testNum: curTestNum,
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
        //alert("Login Success!");
        generateTestOptions();
    } else {
        //alert("Invalid Login.");
        generateLogin();
    }
}

function userRequestStartResponseHandle(data) {

    if (data.verify) {
        let curTest = data.test;
        generateRound(curTest, data.answers);
        alert("Contest Started!");
        console.log(curTest);
    } else {
        alert("User Request Start Denied.")
    }
}

function userQuestionSubmitResponseHandle(data) {
    let { verify, qData } = data;
    if (verify) {
        console.log(qData);
        for (let i = 0; i < qData.length; i++) {
            let curData = qData[i];
            console.log(curData, curData == null)
            if (curData != null) {
                console.log(curData);
                prevAnswerElems[i].textContent = curData;
            }
        }

    } else {
        alert("Question submit failed. Try refreshing page")
    }
}

function testEndHandle(data) {
    let { verify, testNum } = data;
    if (verify) {
        alert(`Round ${testNum} ended!`)
    }
    generateTestOptions();
}


let questionElems = [],
    inputElems = [],
    buttonElems = [],
    prevAnswerElems = []

function generateTestOptions() {
    while (section_container.hasChildNodes()) {
        section_container.removeChild(section_container.firstChild);
    }
    questionElems = [];
    inputElems = [];
    buttonElems = [];
    prevAnswerElems = [];
    let tSection = document.createElement("section");
    tSection.classList = "clean-block features";
    let tContainer = document.createElement("div");
    tContainer.classList = "container";
    tSection.appendChild(tContainer);
    let tHeading = document.createElement("div");
    tHeading.classList = "block-heading";
    let tHeadingTitle = document.createElement("h2");
    tHeadingTitle.classList = "text-info";
    tHeadingTitle.textContent = "Login";
    let tHeadingParagraph = document.createElement("p");
    tHeadingParagraph.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quam urna, dignissim nec auctor in, mattis vitae leo."
    tHeading.appendChild(tHeadingTitle);
    tHeading.appendChild(tHeadingParagraph);
    tContainer.appendChild(tHeading);
    let testDiv = document.createElement("div");
    let allTests = JSON.parse(localStorage.getItem("tests"));
    for (let i = 0; i < allTests.length; i++) {
        let temp = allTests[i];
        console.log(temp.name);
        let tRow = document.createElement("div");
        tRow.classList = "row";
        let testName = document.createElement("div");
        testName.classList = "col-4";
        testName.textContent = temp.name;
        let testTime = document.createElement("div");
        testTime.classList = "col-5";
        testTime.textContent = new Date(temp.time).toLocaleString();
        let testStart = document.createElement("div");
        testStart.classList = "col-3";
        let testButton = document.createElement("button");
        testButton.textContent = "Start";
        testStart.appendChild(testButton);
        tRow.appendChild(testName);
        tRow.appendChild(testTime);
        tRow.appendChild(testStart);
        testButton.addEventListener("click", () => {
            userRequestStart(i);
        })
        testDiv.appendChild(tRow);
    }

    tContainer.appendChild(testDiv);
    section_container.appendChild(tSection);
}

function generateLogin() {
    while (section_container.hasChildNodes()) {
        section_container.removeChild(section_container.firstChild);
    }
    questionElems = [];
    inputElems = [];
    buttonElems = [];
    prevAnswerElems = [];
    let tSection = document.createElement("section");
    tSection.classList = "clean-block features";
    let tContainer = document.createElement("div");
    tContainer.classList = "container";
    tSection.appendChild(tContainer);
    let tHeading = document.createElement("div");
    tHeading.classList = "block-heading";
    let tHeadingTitle = document.createElement("h2");
    tHeadingTitle.classList = "text-info";
    tHeadingTitle.textContent = "Login";
    let tHeadingParagraph = document.createElement("p");
    tHeadingParagraph.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc quam urna, dignissim nec auctor in, mattis vitae leo."
    tHeading.appendChild(tHeadingTitle);
    tHeading.appendChild(tHeadingParagraph);
    tContainer.appendChild(tHeading);
    let loginSection = document.createElement("section");
    loginSection.classList = "login-clean";
    let form = document.createElement("div");
    form.classList = "container";
    let loginHeader = document.createElement("h2");
    loginHeader.classList = "sr-only";
    loginHeader.textContent = "Login";
    form.appendChild(loginHeader);



    let emailDiv = document.createElement("div");
    emailDiv.classList = "form-group";
    let inputEmailDiv = document.createElement("input");
    inputEmailDiv.classList = "form-control";
    inputEmailDiv.type = "email";
    inputEmailDiv.name = "email";
    inputEmailDiv.placeholder = "Email";
    emailDiv.appendChild(inputEmailDiv);
    form.appendChild(emailDiv);
    let passwordDiv = document.createElement("div");
    passwordDiv.classList = "form-group";
    let inputpasswordDiv = document.createElement("input");
    inputpasswordDiv.classList = "form-control";
    inputpasswordDiv.type = "password";
    inputpasswordDiv.name = "password";
    inputpasswordDiv.placeholder = "Password";
    passwordDiv.appendChild(inputpasswordDiv);
    form.appendChild(passwordDiv);

    let buttonDiv = document.createElement("div");
    buttonDiv.classList = "form-group";
    let inputbuttonDiv = document.createElement("button");
    inputbuttonDiv.classList = "btn btn-primary btn-block";
    inputbuttonDiv.textContent = "Log In";
    inputbuttonDiv.addEventListener("click", () => {
        let etc = inputEmailDiv.value;
        let ptc = inputpasswordDiv.value;
        etc != "" && ptc != "" ? loginSend(etc, ptc) : alert("Empty email or password");
    })
    buttonDiv.appendChild(inputbuttonDiv);
    form.appendChild(buttonDiv);

    loginSection.appendChild(form);
    tContainer.appendChild(loginSection);
    section_container.appendChild(tSection);
}

function generateRound(questions, answers = null) {
    while (section_container.hasChildNodes()) {
        section_container.removeChild(section_container.firstChild);
    }
    questionElems = [];
    inputElems = [];
    buttonElems = [];
    prevAnswerElems = [];
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
        prevAns.textContent = answers != null && answers[i] != null ? answers[i] : "N/A"
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
                userQuestionSubmit(i, curVal);
            }
        });
        questionElems.push(tDiv);
    }

    tContainer.appendChild(tQLDiv);

    section_container.appendChild(tSection);
}