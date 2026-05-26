import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import documentsRouter from "./documents";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(documentsRouter);
router.use(profileRouter);

export default router;
