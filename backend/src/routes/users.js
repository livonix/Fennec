import bcrypt from "bcryptjs";
import express from "express";
import prisma from "../config/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { schemas, validateRequest } from "../middleware/validation.js";

const router = express.Router();

router.get("/@me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        status: true,
        presence: true,
        profile: true,
        badges: true,
        flags: true,
        createdAt: true,
        updatedAt: true,
        ownedServers: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            createdAt: true,
          },
        },
        serverMembers: {
          include: {
            server: {
              select: {
                id: true,
                name: true,
                description: true,
                icon: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

router.patch(
  "/@me",
  authenticateToken,
  validateRequest(schemas.user.update),
  async (req, res) => {
    try {
      const { username, avatar, status, presence, profile } = req.body;

      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            id: { not: req.user.id },
          },
        });

        if (existingUser) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(username && { username }),
          ...(avatar && { avatar }),
          ...(status && { status }),
          ...(presence && { presence }),
          ...(profile && { profile }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          status: true,
          presence: true,
          profile: true,
          badges: true,
          flags: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        status: true,
        presence: true,
        profile: true,
        badges: true,
        flags: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.patch("/@me/username", authenticateToken, async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: req.user.id },
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { username },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        status: true,
        presence: true,
        profile: true,
        badges: true,
        flags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Change username error:", error);
    res.status(500).json({ error: "Failed to change username" });
  }
});

export default router;
