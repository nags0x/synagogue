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

describe("User avatar information", async () => {
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