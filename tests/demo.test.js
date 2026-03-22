const { default: axios } = require('axios');
const dotenv = require('dotenv');
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
                authorization: `Bearer ${token}`
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
                authorization: `Bearer ${token}`
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
                authorization: `Bearer ${token}`
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
                authorization: `Bearer ${token}`
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
    beforeAll(async () => {
        let username = "Ganesh" + Math.random();
        let password = "123456";

        const adminSignUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: admin
        });
        
        let adminId = adminSignInResponse.data.userId;

        const adminSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`,{
            username,
            password,
            type: admin
        });

        let adminToken = adminSignInResponse.data.token;

        const userSignUpResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password
        });

        let userId = userSignUpResponse.data.userId;

        const userSignInResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });

        let userToken = userSignInResponse.data.token;

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        let element1Id = element1Response.data.id;

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
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
                authorization: `Bearer ${adminToken}`
            }
        });

        let mapId = mapResponse.data.id;

    });

    test("If space could be successfully created", async() => {

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test Map",
            "dimensions": "100x200",
            "mapId": mapId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
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
                authorization: `Bearer ${userToken}`
            }
        })

        expect(spaceResponse).toBeDefined();
    });

    test("Expect creation of map to fail without mapId and dimension", async() => {

        const spaceInformation = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            name: "Test Failed Map"
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        expect(spaceInformation.status).toBe(400);
    });

    test("User is not able to delete a space that doesn't exist", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/wrongIdThatDoesntExist`, {
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(400);
    });

    test("User is able to delete a space that exists", async() => {

        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,{
            "name": "Test Map",
            "dimension": "100x200",
        }, {
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })
        expect(deleteResponse.status).toBe(200);
    });
})