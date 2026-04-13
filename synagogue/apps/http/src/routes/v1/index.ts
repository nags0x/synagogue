import { Router } from "express";

export const router = Router();

router.get("/signup", (req, res) => {
    res.json({
        message: "Signup"
    })
})

router.get("/signin", (req, res) => {
    res.json({
        message: "Signin"
    })
})

