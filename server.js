
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

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
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

let contests = [[1, 23, 3, 4, 55], [2, 2, 3, 4, 5], 3, 4];
let testNames = [{ name: "Combinatorics", time: Date.now(), num: 0 }, { name: "Algebra", time: Date.now(), num: 0 }]
let testTimes = [1, 1, 30, 30];
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
    console.log(temp);
    if (temp != null && pin === temp.pin) {
        if (isIndividual[testNum] || isIndividual[ctir[email.toLowerCase()].ctn]) {
            console.log("THIS WAS CALLEDind", ctir[email.toLowerCase()].acceptResponses);








            if (!ctir[email.toLowerCase()].acceptResponses) {
                if (testNum == null) {
                    console.log("THIS WAS CALLED");
                    ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
                    return;
                }
                ctir[email.toLowerCase()].acceptResponses = true;
                ctir[email.toLowerCase()].ctn = testNum
                let curTestTime = testTimes[testNum];
                ctir[email.toLowerCase()].endTime = Date.now() + curTestTime * 60 * 1000;
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
                if (testNum == null) {
                    ws.send(JSON.stringify({ id: "userRequestStartResponse", msg: { verify: false } }));
                    return;
                }
                ctgs[cttgl[email.toLowerCase()]].acceptResponses = true;
                ctgs[cttgl[email.toLowerCase()]].ctn = testNum
                let curTestTime = testTimes[testNum];
                ctgs[cttgl[email.toLowerCase()]].endTime = Date.now() + curTestTime * 60 * 1000;
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
