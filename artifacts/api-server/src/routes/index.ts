import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import documentsRouter from "./documents";
import profileRouter from "./profile";
import extractTextRouter from "./extractText";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(documentsRouter);
router.use(profileRouter);
router.use(extractTextRouter);

export default router;
