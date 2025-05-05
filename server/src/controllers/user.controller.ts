import type { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

class UserController {
  async getTransactionSummary(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      const summary = await userService.getTransactionSummary(miniPayAddress);
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error in getTransactionSummary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserLiquidity(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      const liquidity = await userService.getUserLiquidity(miniPayAddress);
      res.status(200).json(liquidity);
    } catch (error) {
      console.error("Error in getUserLiquidity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      const profile = await userService.getUserProfile(miniPayAddress);
      res.status(200).json(profile);
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const miniPayAddress = req.headers["x-minipay-address"] as string;

      if (!miniPayAddress) {
        res.status(400).json({ error: "No MiniPay Address connected" });
        return;
      }

      const history = await userService.getUserHistory(miniPayAddress);
      res.status(200).json(history);
    } catch (error) {
      console.error("Error in getUserHistory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default UserController;
