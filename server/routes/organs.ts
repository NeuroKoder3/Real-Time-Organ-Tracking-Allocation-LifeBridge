import { Router } from "express";
const router = Router();

// Example endpoint
router.get("/", (_req, res) => {
  res.json({ message: "Endpoint working!" });
});

export default router;
