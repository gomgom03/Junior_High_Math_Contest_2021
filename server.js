
const express = require('express');
const app = express();
const fs = require('fs');
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static("public"));

let server = app.listen(port, () => {
    console.log(`Listening to port ${port}`);
})

app.get('/', (req, res) => {
    res.render("home.ejs")
});

app.get('/contest', (req, res) => {
    res.render("contest.ejs")
});

let ctts = {}; //contestants;
let ctgs = {}; //contestgroups;
let cttgl = {}; //contestant group lookup

fs.readFile("./contestants.txt", "utf-8", (err, data) => {
    let formattedData = data.split("\n").map(x => x.split("\t").map(x => x == "\r" ? "" : x));
    //organize data;
    //email, fName, lName, parentPerm, ms, hs, excited, 
    for (let i = 0; i < formattedData.length; i++) {
        let curStudent = formattedData[i];
        let tEmail = curStudent[0].toLowerCase()
        ctts[tEmail] = {
            fName: curStudent[1],
            lName: curStudent[2],
            parentPerm: curStudent[3],
            ms: curStudent[4],
            hs: curStudent[5],
            email: tEmail,
            pin: parseInt(Math.random() * Math.pow(10, Math.random() * 3 + 3)).toString(16),
            pw: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
        }
        tEmail === "wang.jenna129@gmail.com" || tEmail === "wonseoks2220@northbrook28.net" | tEmail === "zbenisvy@student.district31.net" ? console.log([tEmail, ctts[tEmail].pw]) : null;

    }
    console.log(ctts);
    //createGroups(ctts);
});

fs.readFile("./groups.txt", "utf-8", (err, data) => {
    let formattedData = data.split("\n").map(x => x.split("|"));
    for (let i = 0; i < formattedData.length; i++) {
        let curGroup = `Group ${i + 1}`;
        ctgs[curGroup] = {
            wsList: [],
            answers: [],
            acceptResponses: false
        };
        for (let i = 0; i < contests.length; i++) {
            ctgs[curGroup].answers.push([]);
        }
        formattedData[i].forEach(x => {
            cttgl[x] = curGroup;
        })
    }
    console.log(cttgl, ctgs)
})

const WebSocket = require("ws");

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        let parsedData = JSON.parse(data);
        let { id, msg } = parsedData;
        switch (id) {
            case "login":
                ws.send(JSON.stringify({ id: "loginResponse", msg: loginHandle(msg, ws) }));
                break;
            case "userRequestStart":
                userRequestStartHandle(msg)
                //ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: userRequestStartHandle(msg) }));
                break;
            case "userQuestionSubmit":
                userQuestionSubmitHandle(msg, ws);
                //ws.send(JSON.stringify({ id: "userQuestionSubmitResponse", msg: userQuestionSubmitHandle(msg) }));
                break;
        }
    })
});
/*
function createGroups(students) {
    let arr = [];
    let schoolList = [];
    let totStudents = 0;
    for (let key in students) {
        totStudents++;
        let curStudent = students[key];
        let curMs = curStudent.ms;
        let curInd = arr.indexOf(curMs)
        curInd === -1 ? (schoolList.push([key]), arr.push(curMs)) : schoolList[curInd].push(key);
    }
    let groupList = [];
    while (totStudents !== 0) {
        schoolList.sort((a, b) => b.length - a.length);
        while(schoolList.length !==0){
            let curGroup = schoolList.shift();
            curGroup.forEach(x=>{
                
            })
        }
    }

    let curStr = schoolList.map(x => x.join("|")).join("\n");
    fs.writeFile("./groups.txt", curStr, (err) => {
        if (err) {
            console.log(err);
        }
    });
    console.log(schoolList);
}
*/

function loginHandle(message, ws) {
    let { email, pw } = message;
    if (email == null || pw == null) {
        return { verify: false }
    }
    let temp = ctts[email.toLowerCase()];
    if (temp != null && temp.pw === pw) {
        ctgs[cttgl[email.toLowerCase()]].wsList.push(ws);
        return Object.assign({ ...temp }, { verify: true });
    } else {
        return { verify: false }
    }
}

let contests = [1, [2, 2, 3, 4, 5], 3, 4];
let testTimes = [1, 0.2, 30, 30];
let testTypes = ["individual", "team", "individual", "relay"]

//These should store actual contest data.

function userRequestStartHandle(message) {
    let { pin, email, testNum } = message;
    console.log(pin, email, testNum);
    if (pin == null || email == null || testNum == null) {
        return { verify: false };
    }
    //find group and initiate start if time is right and email is right
    let temp = ctts[email.toLowerCase()];
    console.log(temp);
    if (temp != null && pin === pin) {
        ctgs[cttgl[email.toLowerCase()]].acceptResponses = true;
        let curTestTime = testTimes[testNum];
        setTimeout(() => {
            console.log(ctgs[cttgl[email.toLowerCase()]])
            ctgs[cttgl[email.toLowerCase()]].wsList.forEach(x => {
                if (x.readyState === WebSocket.OPEN) {
                    x.send(JSON.stringify({
                        id: "testEnd",
                        msg: {
                            verify: true
                        }
                    }))
                }
            })
            ctgs[cttgl[email.toLowerCase()]].acceptResponses = false;
        }, curTestTime * 60 * 1000)
        let curTeam = ctgs[cttgl[email.toLowerCase()]];
        curTeam.wsList.forEach(x => {
            if (x.readyState === WebSocket.OPEN) {
                x.send(JSON.stringify({
                    id: "userRequestStartResponse",
                    msg: {
                        verify: true,
                        test: contests[testNum],
                        time: curTestTime
                    }
                }))
            }
        })

        return;
    } else {
        ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
    }
}

function userQuestionSubmitHandle(message, ws) {
    let { pin, email, testNum, qNum, qData } = message;
    console.log(pin, email, testNum, qNum, qData);
    if (pin == null || email == null || testNum == null || qNum == null || qData == null) {
        ws.send(JSON.stringify({ id: "userQuestionSubmitResponse", msg: { verify: false } }));
        return;
    }
    //find group and initiate start if time is right and email is right
    let temp = ctts[email.toLowerCase()];
    console.log(temp);
    if (temp != null && temp.pin === pin) {
        let curTeam = ctgs[cttgl[email.toLowerCase()]];
        if (curTeam.acceptResponses == true) {
            curTeam.answers[testNum][qNum] = qData;
            curTeam.wsList.forEach(x => {
                if (x.readyState === WebSocket.OPEN) {
                    x.send(JSON.stringify({
                        id: "userQuestionSubmitResponse",
                        msg: {
                            verify: true,
                            qNum: qNum,
                            qData: qData
                        }
                    }))
                }
            })
            console.log(ctgs);
            return;
        } else {
            ws.send(JSON.stringify({ id: "userQuestionSubmitResponse", msg: { verify: false } }));
            return;
        }
    } else {
        ws.send(JSON.stringify({ id: "userQuestionSubmitResponse", msg: { verify: false } }));
        return;
    }
}
