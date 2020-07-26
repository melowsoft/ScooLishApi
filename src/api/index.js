import express from "express";

import adminRoute from "./admin";
import authRoute from "./auth";
import courseRoute from "./course";
import categoryRoute from "./category";

const router = express.Router();

// Use Routes
router.use(adminRoute);
router.use(authRoute);
router.use(courseRoute);
router.use(categoryRoute);

export default router;
