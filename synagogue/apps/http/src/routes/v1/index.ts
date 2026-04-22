import { Router } from "express";
import { spaceRouter } from "./space.js";
import { userRouter } from "./user.js";
import { adminRouter } from "./admin.js";

export const router = Router();

router.post("/signup", (req, res) => {
    res.json({
        message: "Signup"
    })
})

router.post("/signin", (req, res) =>
    res.json({
        message: "Signin"
    })
})

router.get("/user/metadata", (req, res) => {

})

router.get("user/avatars", (req, res) => {

})

router.use("/user", userRouter);
router.use("/space", spaceRouter);
router.use("/admin", adminRouter);