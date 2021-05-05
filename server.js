
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

app.get('/home', (req, res) => {
    res.render("home.ejs")
});

app.get('/schedule', (req, res) => {
    res.render("schedule.ejs")
});

app.get('/contest', (req, res) => {
    res.render("contest.ejs")
});

app.get('/resources', (req, res) => {
    res.render("resources.ejs")
});
app.get('/admin', (req, res) => {
    res.render("admin.ejs");
})

// app.get('/mj', (req, res) => {
//     res.render("mjtest.ejs")
// });

let ctts = {}; //contestants;
let ctgs = {}; //contestgroups;
let ctis = {}; // individual sockets
let ctir = {};
let cttgl = {}; //contestant group lookup

fs.readFile("./contestants.txt", "utf-8", (err, data) => {
    let formattedData = data.split("\n").map(x => x.split("\t").map(x => x == "\r" ? "" : x));
    //organize data;
    //email, fName, lName, parentPerm, ms, hs, excited, 
    for (let i = 0; i < formattedData.length; i++) {
        let curStudent = formattedData[i];
        let tEmail = curStudent[0].toLowerCase();
        ctir[tEmail.toLowerCase()] = {
            wsList: [],
            answers: [],
            acceptResponses: false,
            endTime: null,
            ctn: null
        };
        for (let i = 0; i < contests.length; i++) {
            ctir[tEmail].answers.push([]);
        }
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
        setTimeout(() => { console.log(tEmail + "\t" + ctts[tEmail].pw + "\t" + cttgl[tEmail]) }, 500);

    }
    //console.log(ctts);
    //createGroups(ctts);
});

fs.readFile("./groups.txt", "utf-8", (err, data) => {
    let formattedData = data.split("\n").map(x => x.split("|"));
    for (let i = 0; i < formattedData.length; i++) {
        let curGroup = `Group ${i + 1}`;
        ctgs[curGroup] = {
            wsList: [],
            answers: [],
            acceptResponses: false,
            endTime: null,
            ctn: null
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
let adminStarted = [false, false];
const wss = new WebSocket.Server({ server });

function clearAnswers() {
    updateSpreadSheet();
    for (let cEmail in ctir) {
        ctir[cEmail].answers = [];
        for (let i = 0; i < contests.length; i++) {
            ctir[cEmail].answers.push([]);
        }
    }
    for (let cGroup in ctgs) {
        ctgs[cGroup].answers = [];
        for (let i = 0; i < contests.length; i++) {
            ctgs[cGroup].answers.push([]);
        }
    }
}

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        if (!isNaN(data)) {
            let tData = parseInt(data);
            switch (tData) {
                case 0:
                case 1:
                    adminStarted[data] = true;
                    break;
                case 2:
                case 3:
                    adminStarted[data - 2] = false;
                    break;
                case 4:
                    clearAnswers();
                    break;
                default:
                    break;
            }

            console.log(adminStarted);
            return;
        }
        let parsedData = JSON.parse(data);
        let { id, msg } = parsedData;
        switch (id) {
            case "login":
                loginHandle(msg, ws)


                break;
            case "userRequestStart":
                userRequestStartHandle(msg, ws)
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
        ws.send(JSON.stringify({ id: "loginResponse", msg: { verify: false } }));
    }
    let temp = ctts[email.toLowerCase()];
    console.log(temp);
    if (temp != null && temp.pw === pw) {
        ctis[email.toLowerCase()] = ws;
        ctgs[cttgl[email.toLowerCase()]].wsList.push(ws);
        ctir[email.toLowerCase()].wsList.push(ws);
        ws.send(JSON.stringify({ id: "loginResponse", msg: Object.assign({ ...temp }, { verify: true, tests: JSON.stringify(testNames) }) }));
        ctgs[cttgl[email.toLowerCase()]].acceptResponses || ctir[email.toLowerCase()].acceptResponses ? userRequestStartHandle(temp, ws, true) : null;
    } else {
        ws.send(JSON.stringify({ id: "loginResponse", msg: { verify: false } }));
    }
}


let contests = [null, [1], null, null];
fs.readFile("./contest.txt", "utf-8", (err, data) => {
    let contestData = data.split("\n");
    let ind = contestData.indexOf("_\r");
    console.log("============>" + ind);
    contests[0] = contestData.slice(0, ind);
    contests[1] = contestData.slice(ind + 1);
})


let testNames = [{ name: "Individual", time: Date.now(), num: 0 }, { name: "Teams", time: Date.now(), num: 0 }]
let testTimes = [30, 30, 30, 30];
let isIndividual = [true, false];
let testTypes = ["individual", "team", "individual", "relay"]

//These should store actual contest data.

function userRequestStartHandle(message, ws, ind = false) {
    let { pin, email, testNum } = message;
    console.log(pin, email, testNum);
    if (pin == null || email == null) {
        ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
        return;
    }
    //find group and initiate start if time is right and email is right
    let temp = ctts[email.toLowerCase()];
    //console.log(temp != nul, pin === temp.pin, adminStarted[testNum]);
    if (temp != null && pin === temp.pin && (adminStarted[testNum] || ctir[email.toLowerCase()].acceptResponses || ctgs[cttgl[email.toLowerCase()]].acceptResponses)) {
        if (isIndividual[testNum] || isIndividual[ctir[email.toLowerCase()].ctn]) {
            console.log("THIS WAS CALLEDind", ctir[email.toLowerCase()].acceptResponses);








            if (!ctir[email.toLowerCase()].acceptResponses) {
                console.log("THIS: " + ctir[email.toLowerCase()].answers[testNum][0]);
                if (testNum == null || ctir[email.toLowerCase()].answers[testNum][0] != null) {
                    console.log("1 Called");
                    ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
                    return;
                }
                ctir[email.toLowerCase()].acceptResponses = true;
                ctir[email.toLowerCase()].ctn = testNum
                let curTestTime = testTimes[testNum];
                let tEndTime = Date.now() + curTestTime * 60 * 1000;
                ctir[email.toLowerCase()].endTime = tEndTime;
                setTimeout(() => {
                    console.log(ctir[email.toLowerCase()])
                    ctir[email.toLowerCase()].wsList.forEach(x => {
                        if (x.readyState === WebSocket.OPEN) {
                            x.send(JSON.stringify({
                                id: "testEnd",
                                msg: {
                                    verify: true,
                                    testNum: testNum
                                }
                            }))
                        }
                    })
                    ctir[email.toLowerCase()].acceptResponses = false;
                }, curTestTime * 60 * 1000)
            }
            ////////START HERE
            let curTeam = ctir[email.toLowerCase()];
            if (ind) {
                let curSocket = ctis[email.toLowerCase()];
                if (curSocket.readyState === WebSocket.OPEN) {
                    curSocket.send(JSON.stringify({
                        id: "userRequestStartResponse",
                        msg: {
                            verify: true,
                            test: contests[ctir[email.toLowerCase()].ctn],
                            answers: curTeam.answers[ctir[email.toLowerCase()].ctn],
                            endTime: ctir[email.toLowerCase()].endTime
                        }
                    }))
                }
            } else {

                curTeam.wsList.forEach(x => {
                    if (x.readyState === WebSocket.OPEN) {
                        x.send(JSON.stringify({
                            id: "userRequestStartResponse",
                            msg: {
                                verify: true,
                                test: contests[ctir[email.toLowerCase()].ctn],
                                endTime: ctir[email.toLowerCase()].endTime
                            }
                        }))
                    }
                })

                return;
            }


















        } else {
            if (!ctgs[cttgl[email.toLowerCase()]].acceptResponses) {
                if (testNum == null || ctgs[cttgl[email.toLowerCase()]].answers[testNum][0] != null) {
                    console.log("2 Called");
                    ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
                    return;
                }
                ctgs[cttgl[email.toLowerCase()]].acceptResponses = true;
                ctgs[cttgl[email.toLowerCase()]].ctn = testNum
                let curTestTime = testTimes[testNum];
                let tEndTime = Date.now() + curTestTime * 60 * 1000
                ctgs[cttgl[email.toLowerCase()]].endTime = tEndTime;
                setTimeout(() => {
                    console.log(ctgs[cttgl[email.toLowerCase()]], ctir);
                    ctgs[cttgl[email.toLowerCase()]].wsList.forEach(x => {
                        if (x.readyState === WebSocket.OPEN) {
                            x.send(JSON.stringify({
                                id: "testEnd",
                                msg: {
                                    verify: true,
                                    testNum: testNum
                                }
                            }))
                        }
                    })
                    ctgs[cttgl[email.toLowerCase()]].acceptResponses = false;
                }, curTestTime * 60 * 1000)
            }
            let curTeam = ctgs[cttgl[email.toLowerCase()]];
            if (ind) {
                let curSocket = ctis[email.toLowerCase()];
                if (curSocket.readyState === WebSocket.OPEN) {
                    curSocket.send(JSON.stringify({
                        id: "userRequestStartResponse",
                        msg: {
                            verify: true,
                            test: contests[ctgs[cttgl[email.toLowerCase()]].ctn],
                            answers: curTeam.answers[ctgs[cttgl[email.toLowerCase()]].ctn],
                            endTime: ctgs[cttgl[email.toLowerCase()]].endTime
                        }
                    }))
                }
            } else {

                curTeam.wsList.forEach(x => {
                    if (x.readyState === WebSocket.OPEN) {
                        x.send(JSON.stringify({
                            id: "userRequestStartResponse",
                            msg: {
                                verify: true,
                                test: contests[ctgs[cttgl[email.toLowerCase()]].ctn],
                                endTime: ctgs[cttgl[email.toLowerCase()]].endTime
                            }
                        }))
                    }
                })

                return;
            }
        }
    } else {
        console.log("3 called");
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
    console.log(ctir);
    //find group and initiate start if time is right and email is right
    let temp = ctts[email.toLowerCase()];
    console.log(temp, pin);
    if (temp != null && temp.pin === pin) {

        if (isIndividual[ctir[email.toLowerCase()].ctn]) {




            let curTeam = ctir[email.toLowerCase()];
            if (curTeam.acceptResponses == true) {
                curTeam.answers[testNum][qNum] = qData;
                curTeam.wsList.forEach(x => {
                    if (x.readyState === WebSocket.OPEN) {
                        x.send(JSON.stringify({
                            id: "userQuestionSubmitResponse",
                            msg: {
                                verify: true,
                                qData: curTeam.answers[testNum]
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
            let curTeam = ctgs[cttgl[email.toLowerCase()]];
            if (curTeam.acceptResponses == true) {
                curTeam.answers[testNum][qNum] = qData;
                curTeam.wsList.forEach(x => {
                    if (x.readyState === WebSocket.OPEN) {
                        x.send(JSON.stringify({
                            id: "userQuestionSubmitResponse",
                            msg: {
                                verify: true,
                                qData: curTeam.answers[testNum]
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
        }
    } else {
        ws.send(JSON.stringify({ id: "userQuestionSubmitResponse", msg: { verify: false } }));
        return;
    }
}




const sheetsObj = require("./sheetsConnect.js");
console.log(sheetsObj);
let writer = new sheetsObj();
//console.log(writer);
writer.run();
//a.writeData("Individual", "A1", [["hello"]]);

function updateSpreadSheet() {
    let wt = [];
    for (key in ctgs) {
        let arr = [key];
        let cur = ctgs[key];
        arr = arr.concat(cur.answers[1]);
        wt.push(arr);
    }
    //console.log(wt);
    writer.writeData("Team", "A1", wt);
    wt = [];
    for (key in ctir) {
        let arr = [ctts[key].fName + " " + ctts[key].lName];
        let cur = ctir[key];
        arr = arr.concat(cur.answers[0]);
        wt.push(arr);
    }
    writer.writeData("Individual", "A1", wt);
    // console.log(wt);
    // console.log(Object.keys(ctgs));
    // console.log(Object.keys(ctir));
}

setInterval(updateSpreadSheet, 240000);