import { Router, type IRouter } from "express";
import healthRouter from "./health";
import deployRouter from "./deploy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(deployRouter);

export default router;
