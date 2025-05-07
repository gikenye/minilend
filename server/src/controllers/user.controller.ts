import type { Request, Response } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

class UserController {
  async getTransactionSummary(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const summary = await userService.getTransactionSummary(
        req.user!.address
      );
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error in getTransactionSummary:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserLiquidity(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const liquidity = await userService.getUserLiquidity(req.user!.address);
      res.status(200).json(liquidity);
    } catch (error) {
      console.error("Error in getUserLiquidity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const profile = await userService.getUserProfile(req.user!.address);
      res.status(200).json(profile);
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getUserHistory(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const history = await userService.getUserHistory(req.user!.address);
      res.status(200).json(history);
    } catch (error) {
      console.error("Error in getUserHistory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default UserController;
