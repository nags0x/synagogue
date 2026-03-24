const { default: axios } = require('axios');
const dotenv = require('dotenv');
const { useImperativeHandle } = require('react');
dotenv.config();

const BACKEND_URL=process.env.BACKEND_URL || "http://localhost:3003";

describe("Authentication", () => {
    test("If user is able to signup only once", async () => {
        const username = "Ganesh" + Math.random();
        const password = '123456';
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        expect(response.status).toBe(200);
        
        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        expect(updatedResponse.status).toBe(400);
    })
    
    test("Signup request fails if the username is empty", async () => {
        const username = "Ganesh" + Math.random();
        const password = '123456';

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, () => {
            password
        })

        expect(response.status).toBe(400);
    })

    test("Signin succeeds if username and password are valid", async () => {
        const username = "Ganesh" + Math.random();
        const password = '/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/';

        await axios.post(`${BACKEND_URL}/api/v1/signin`, () => {
            username,
            password
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, () => {
            username,
            password
        });

        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
    })

    test("Signin fails if username and password are invalid", async () => {
        const username = "Ganesh" + Math.random();
        const password = '123456';

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password
        })

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUserName",
            password
        })

        expect(response.status).toBe(403);
    })

})

describe("User metadata endpoint", () => {
    let token = "";
    let avatarId = "";

    beforeAll(async () => {
        const username = "Ganesh" + Math.random();
        const password = '123456';

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password
        })

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        token = response.data.token;

        const avatarResponse = axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Nags"
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        console.log("Avatar Response: " + avatarResponse.data.avatarId);
        avatarId = avatarResponse.data.avatarId;

    })

    test("User can't update their metadata if the the avatarId is wrong", async () => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "1231234234"
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).tobe(400);
    })

    test("User can't update their metadata if the auth header is not present", async () => {

        const response = await axios.post(`${BACKEND_URl}/api/v1/user/metadata`, {
            avatarId: `${avatarId}`
        })

        expect(response.status).toBe(403)
    })

    test("User can update their metadata if it's the right avatarId and with the auth headers", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,{
            avatarid: `${avatarId}`
        }, {
            headers: {
                "authorization": `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200);

    })

})

describe("User avatar information",() => {
    beforeAll(async () => {

        let userId = "";
        let token = "";
        let avatarId = "";

        const username = `Ganesh-${Math.random()}`
        const password = "123456"

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            "type": "admin"
        });
        userId = signupResponse.data.userId;

        const signinResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });
        token = signinResponse.data.token;

        const response = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Nags"
        },{
            headers: {
                "authorization": `Bearer ${token}`
            }
        });

        avatarId = response.data.avatarId;

    })

    test("Get avatar information for a user", async() => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);
        expect(response.data.avatars[0].userId).toBe(userId);
        expect(response.data.avatars.length).toBe(1);
    })

    test("If available avatars lists the updated one", async() => {
        const response =  await axios.get(`${BACKEND_URL}/api/v1/avatars`);
        expect(response.data.avatars.length).not.toBe(0);
        const currentAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined();
    })
})

describe("Space information", () => {
    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        let username = "Ganesh" + Math.random();
        let password = "123456";

        const adminSignUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: admin
        });
        
        adminId = adminSignInResponse.data.userId;

        const adminSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            username,
            password,
            type: admin
        });

        adminToken = adminSignInResponse.data.token;

        const userSignUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password
        });

        userId = userSignUpResponse.data.userId;

        const userSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        userToken = userSignInResponse.data.token;

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        });

        element1Id = element1Response.data.id;

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/map`, {
                    "thumbnail": "https://thumbnail.com/a.png",
                    "dimensions": "100x200",
                    "name": "100 person interview room",
                    "defaultElements": [{
                        elementId: "chair1",
                        x: 20,
                        y: 20
                    }, {
                        elementId: "chair2",
                        x: 18,
                        y: 20
                    }, {
                        elementId: "table1",
                        x: 19,
                        y: 20
                    }, {
                        elementId: "table2",
                        x: 19,
                        y: 20
                    }
                ]
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        });

        mapId = mapResponse.data.id;

    });

    test("If space could be successfully created", async() => {

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test Map",
            "dimensions": "100x200",
            "mapId": mapId
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        });

        expeet(spaceResponse.status).toBe(200);
        expect(spaceResponse.data.spaceId).toBeDefined();
    });

    test("If space could be created without having mapId (empty space)", async() => {

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test New Map",
            "dimensions": "100x200",
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(spaceResponse).toBeDefined();
    });

    test("Expect creation of map to fail without mapId and dimension", async() => {

        const spaceInformation = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test Failed Map"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(spaceInformation.status).toBe(400);
    });

    test("User is not able to delete a space that doesn't exist", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/wrongIdThatDoesntExist`, {
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(400);
    });

    test("User is able to delete a space that exists", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,{
            "name": "Test Space",
            "dimensions": "100x200",
        }, {
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        });

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })
        expect(deleteResponse.status).toBe(200);
    });

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0);
    });

    test("Admin gets the spaces after creation", async() => {
        const spaceCreationResponse = await axios.post(`${BACKEND_URL}/api/v1/space`,{
            "name": "Test Space",
            "dimensions": "100x200"
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        });

        const getAllSpacesResponse = await axios.get(`${BACKEND_URL}/api/v1/space/all`,{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        });

        const filteredResponse = getAllSpacesResponse.data.spaces.find(x => x.id == spaceCreationResponse.data.spaceId);
        expect(getAllSpacesResponse.data.spaces.length).toBe(1);
        expect(filteredResponse).toBeDefined();

    })

})

describe("Arena Endpoints", () => {
    let userId;
    let userToken;
    let adminId;
    let adminToken;
    let element1Id;
    let element2Id;
    let mapId;
    let spaceId;

    beforeAll( async() => {
        const username = `Ganesh-${Math.random()}`;
        const password = "123456";

        const adminIdResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            "username": username + "-admin",
            "password": password,
            type: "admin"
        });
        
        adminId = adminIdResponse.data.userId;

        const adminTokenResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            "username": username + "-admin",
            "password": password
        })

        adminToken = adminTokenResponse.data.token;

        const userIdResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            "username": username + "-user",
            "password": password,
            type: "user"
        })

        userId = userIdResponse.data.userId;

        const userTokenResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            "username": username + "-user",
            "password": password,
            type: "user"
        })

        userToken = userTokenResponse.data.token;

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
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

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
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

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{

                "thumbnail": "https://thumbnail.com/a.png",
                "dimensions": "100x200",
                "name": "100 person interview room",
                "defaultElements": [{
                        elementId: element1Id,
                        x: 20,
                        y: 20
                    }, {
                        elementId: element2Id,
                        x: 18,
                        y: 20
                    }]
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        })

        mapId = mapResponse.data.id;

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`,{
	        "name": "Test",
            "dimensions": "100x200",
            "mapId": mapId
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        spaceId = spaceResponse.data.spaceId;
    });

    test("Getting a space fails for wrong space id", async() => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space`,{
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400);
    })

    test("Get space information on valid/ existing space id", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/${spaceId}`,{
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(response.data.dimensions).toBe("100x200");
        expect(response.data.elements.length).toBe(2);

    })

    test("Add elements", async() => {

    },{
        headers:{
            "authorization": `Bearer ${userToken}`
        }
    })

    test("Adding an element fails if placed out-of-bounds", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space/element`,{
            "elementId": element1Id,
            "spaceId": spaceId,
            "x": 100000,
            "y": 200000
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400);
    })

    test("Add element endpoint is able to insert an element", async() => {
        let newElementId;

        const response1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true 
        },{
            headers:{
                "authorization": `Bearer ${adminToken}`
            }
        })

        newElementId = response1.data.id;

        const response = await axios.post(`${BACKEND_URL}/api/v1/${spaceId}/element`,{
            "elementId": newElementId,
            "spaceId": spaceId,
            "x": 50,
            "y": 20
        })

        const spaceResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`,{
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(spaceResponse.data.elements.length).toBe(3);
    })

    test("deleting elements shall fail if called on invalid spaceId", async() => {
        const response = await axios.delete(`${BACKEND_URL}/api/v1/wrongSpaceId/element`,{
            "data": {id: element1Id}
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400);
    })

    test("If delete-element endpoint is working fine", async() => {

        const dResponse = await axios.delete(`${BACKEND_URL}/api/v1/${spaceId}/element`,{
            "data": {id: element1Id}
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        const response = await axios.get(`${BACKEND_URL}/api/v1/${spaceId}`,{
        },{
            headers:{
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(response.data.elements.length).toBe(2);

    })
        
})