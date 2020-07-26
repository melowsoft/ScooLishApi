/**
 * @author TonyStacks
 */

import express from "express";

import { emailSignup, emailLogin } from "./controller";

const router = express.Router();

router.post("/authenticate/email/:userType/signup", emailSignup);

router.post("/authenticate/email/:userType/login", emailLogin);

export default router;
