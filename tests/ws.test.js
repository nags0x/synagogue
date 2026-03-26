const { default: axios, HttpStatusCode } = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const HTTP_URL = process.env.HTTP_URL || "http://localhost:3000";
const WS_URL = process.env.WS_URL || "ws://localhost:3001";

describe("Websocket tests", () => {
    let adminId;
    let adminToken;
    let userId;
    let userToken;
    let element1Id;
    let element2Id;
    let mapId;
    let spaceId;
    let ws1;
    let ws2;
    let ws1Messages = [];
    let ws2Messages = [];
    let adminX;
    let adminY;
    let userX;
    let userY;

    async function setupHTTP(){
        let username = `Ganesh - ${Math.random()}`;
        let password = "123456";

        const adminSignupResponse = await axios.post(`${HTTP_URL}/api/v1/signup`,{
            "username": username + "-admin",
            "password": password,
            type: "admin"
        });

        adminId = adminSignupResponse.data.id;

        const adminSigninResponse = await axios.post(`${HTTP_URL}/api/v1/signin`,{
            "username": username + "-admin",
            "password": password,
            type: "admin"
        });

        adminToken = adminSigninResponse.data.token;

        const userSignupResponse = await axios.post(`${HTTP_URL}/api/v1/signup`,{
            "username": username + "-user",
            "password": password,
            type: "admin"
        });
        
        userId = userSignupResponse.data.id;

        const userSigninResponse = await axios.post(`${HTTP_URL}/api/v1/signin`,{
            "username": username + "-user",
            "password": password,
            type: "admin"
        });
        
        userToken = userSigninResponse.data.token;

        const element1Response = await axios.post(`${HTTP_URL}/api/v1/admin/element`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
	        "width": 1,
	        "height": 1,
            "static": true
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        })

        element1Id = element1Response.data.id;

        const element2Response = await axios.post(`${HTTP_URL}/api/v1/admin/element`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
	        "width": 1,
	        "height": 1,
            "static": true
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        })

        element2Id = element2Response.data.id;

        const mapResponse = await axios.post(`${HTTP_URL}/api/v1/admin/map`,{
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "50 people meeting room",
            "defaultElements": [{
                elementId: element1Id,
                x: 10,
                y: 10
            },{
                elementId: element2Id,
                x: 20,
                y: 20
            }]
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        })

        mapId = mapResponse.data.id;

        const spaceResponse = await axios.post(`${HTTP_URL}/api/v1/space`,{
            "name": "Temp Space",
            "dimensions": "100x200",
            "mapId": mapId
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        spaceId = spaceResponse.data.spaceId;
    }

    async function waitForOpen(ws){
        return new Promise(r => {
            ws.onopen = r;
        })
    }

    async function setupWS(){
        ws1 = new WebSocket(WS_URL);

        ws1.onmessage = (event) => {
            ws1Messages.push(JSON.parse(event.data));
        }

        waitForOpen(ws1);

        ws2 = new WebSocket(WS_URL);

        ws2.onmessage = (event) => {
            ws2Messages.push(JSON.parse(event.data));
        }

        waitForOpen(ws2);
    }

    async function waitForAndGetLatestMessage(wsMessages){
        return new Promise(r => {
            if(wsMessages.length() > 0){
                resolve(wsMessages.shift());
            }else{
                let interval = setInterval(() => {
                    if(wsMessages.length() > 0){
                        wsMessages.shift();
                        clearInterval(interval);
                    }
                },100);
            }
        })
    }
    beforeAll(() => {
        setupHTTP();
        setupWS();
    })

    test("Able to Get acknowledgement when joining a space", async() => {
        ws1.send(JSON.stringify({
            "type": "join",
            "payload": {
	            "spaceId": "123",
	            "token": adminToken
            }
        }))

        console.log("1st user aka admin joined");

        const message1 = waitForAndGetLatestMessage(ws1Messages);

        ws2.send(JSON.stringify({
            "type": "join",
            "payload": {
	            "spaceId": "123",
	            "token": userToken
            }
        }))

        const message2 = waitForAndGetLatestMessage(ws2Messages);
        const message3 = waitForAndGetLatestMessage(ws1Messages);

        expect(message1.type).toBe('space-joined');
        expect(message1.payload.users.length).toBe(0);
        expect(message2.type).toBe('space-joined');
        expect(message2.payload.users.length).toBe(1);
        expect(message3.data.payload).toBe('user-joined');
        expect(message3.payload.x).toBe(message2.payload.spawn.x);
        expect(message3.payload.y).toBe(message2.payload.spawn.y);
        expect(message3.payload.userId).toBe(userId);

        adminX = message1.payload.spawn.x;
        adminY = message1.payload.spawn.y;

        userX = message2.payload.spawn.x;
        userY = message2.payload.spawn.y;
    })

    test("User shouldnt be able to move across the boundaries of the map", async() => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 100000000,
                y: 100000
            }
        }))

        const message = waitForAndGetLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    })

    test("User restricted from moving 2 blocks at the same time", async() => {
        ws1.send(JSON.stringify({
            type: "move",
            payload:{
                x: adminX + 2,
                y: adminY
            }
        }))

        const message = waitForAndGetLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    })

    test("Valid user movement shall be able to transmit a signal to the other user", async() => {
        ws1.send(JSON.stringify({
            type: "move",
            payload:{
                x: adminX + 1,
                y: adminY,
                userId: adminId
            }
        }))

        const message = waitForAndGetLatestMessage(ws2Messages);
        expect(message.type).toBe("movement");
        expect(message.payload.x).toBe(adminX + 2);
        expect(message.payliad.y).toBe(adminY);
    })

    test("Transmit signal to user when fellow user leaves", async() => {
        ws1.close();

        const message = waitForAndGetLatestMessage(ws2Messages);
        expect(message.type).toBe("user-left");
        expect(message.payload.userId).toBe(adminId);
    })
})