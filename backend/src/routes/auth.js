import bcrypt from "bcryptjs";
import express from "express";
import prisma from "../config/database.js";
import { authenticateToken, generateTokens } from "../middleware/auth.js";
import { schemas, validateRequest } from "../middleware/validation.js";

const router = express.Router();

router.post(
  "/account/create",
  validateRequest(schemas.auth.createAccount),
  async (req, res) => {
    try {
      const { email, password, captcha } = req.body;

      // TODO: Validate captcha if needed
      if (captcha) {
        // Captcha validation logic here
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: email.split("@")[0] }, // Generate username from email for now
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ error: "Email already registered" });
        }
        if (existingUser.username === email.split("@")[0]) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username: email.split("@")[0], // Generate username from email for now
          email,
          password: hashedPassword,
          status: "online",
          presence: "Online",
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          status: true,
          presence: true,
          badges: true,
          flags: true,
          createdAt: true,
        },
      });

      const tokens = generateTokens(user.id);

      res.status(201).json({
        user,
        ...tokens,
      });
    } catch (error) {
      console.error("Account creation error:", error);
      res.status(500).json({ error: "Account creation failed" });
    }
  },
);

router.post(
  "/register",
  validateRequest(schemas.auth.register),
  async (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return res.status(400).json({ error: "Email already registered" });
        }
        if (existingUser.username === username) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          status: "online",
          presence: "Online",
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          status: true,
          presence: true,
          badges: true,
          flags: true,
          createdAt: true,
        },
      });

      const tokens = generateTokens(user.id);

      res.status(201).json({
        user,
        ...tokens,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

router.get("/account/", authenticateToken, async (req, res) => {
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
    console.error("Get account error:", error);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

router.post("/account/reverify", async (req, res) => {
  try {
    const { email, captcha } = req.body;

    // TODO: Implement email verification logic
    // For now, just acknowledge the request
    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Reverify error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

router.post("/account/reset_password", async (req, res) => {
  try {
    const { email, captcha } = req.body;

    // TODO: Implement password reset logic
    // For now, just acknowledge the request
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

router.patch("/account/reset_password", async (req, res) => {
  try {
    const { token, password, remove_sessions } = req.body;

    // TODO: Implement password reset confirmation logic
    // For now, just acknowledge the request
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Confirm reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.patch("/account/change/password", async (req, res) => {
  try {
    const { password, current_password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

router.patch("/account/change/email", async (req, res) => {
  try {
    const { email, current_password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { email },
    });

    res.json({ message: "Email changed successfully" });
  } catch (error) {
    console.error("Change email error:", error);
    res.status(500).json({ error: "Failed to change email" });
  }
});

router.put("/account/delete", authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    // TODO: Implement account deletion logic
    // For now, just acknowledge the request
    res.json({ message: "Account deletion initiated" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// Session management routes
router.get("/session/all", authenticateToken, async (req, res) => {
  try {
    // TODO: Implement session management
    // For now, return empty array
    res.json([]);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.delete("/session/all", authenticateToken, async (req, res) => {
  try {
    const { revoke_self } = req.body;

    // TODO: Implement session deletion
    // For now, just acknowledge the request
    res.json({ message: "All sessions deleted" });
  } catch (error) {
    console.error("Delete all sessions error:", error);
    res.status(500).json({ error: "Failed to delete sessions" });
  }
});

router.patch("/session/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { friendly_name } = req.body;

    // TODO: Implement session update
    // For now, just acknowledge the request
    res.json({ message: "Session updated" });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

router.delete("/session/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement session deletion
    // For now, just acknowledge the request
    res.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// MFA routes
router.get("/mfa/", authenticateToken, async (req, res) => {
  try {
    // TODO: Implement MFA status check
    // For now, return disabled status
    res.json({
      totp_mfa: false,
      recovery_codes: [],
    });
  } catch (error) {
    console.error("Get MFA error:", error);
    res.status(500).json({ error: "Failed to fetch MFA status" });
  }
});

router.put("/mfa/ticket", authenticateToken, async (req, res) => {
  try {
    // TODO: Implement MFA ticket generation
    // For now, return a mock ticket
    res.json({
      ticket: "mock_mfa_ticket_" + Date.now(),
    });
  } catch (error) {
    console.error("Create MFA ticket error:", error);
    res.status(500).json({ error: "Failed to create MFA ticket" });
  }
});

router.put("/mfa/totp", async (req, res) => {
  try {
    const { totp_code } = req.body;

    // TODO: Implement TOTP enable
    // For now, just acknowledge the request
    res.json({ message: "TOTP enabled successfully" });
  } catch (error) {
    console.error("Enable TOTP error:", error);
    res.status(500).json({ error: "Failed to enable TOTP" });
  }
});

router.post("/mfa/recovery", async (req, res) => {
  try {
    // TODO: Implement recovery codes generation
    // For now, return mock codes
    res.json(["mock-code-1", "mock-code-2", "mock-code-3"]);
  } catch (error) {
    console.error("Generate recovery codes error:", error);
    res.status(500).json({ error: "Failed to generate recovery codes" });
  }
});

router.patch("/mfa/recovery", async (req, res) => {
  try {
    // TODO: Implement recovery codes regeneration
    // For now, return new mock codes
    res.json(["new-mock-code-1", "new-mock-code-2", "new-mock-code-3"]);
  } catch (error) {
    console.error("Regenerate recovery codes error:", error);
    res.status(500).json({ error: "Failed to regenerate recovery codes" });
  }
});

router.post("/mfa/totp", async (req, res) => {
  try {
    // TODO: Implement TOTP secret generation
    // For now, return mock secret
    res.json({
      secret: "mock_totp_secret",
      qr_code: "mock_qr_code_data",
    });
  } catch (error) {
    console.error("Generate TOTP secret error:", error);
    res.status(500).json({ error: "Failed to generate TOTP secret" });
  }
});

router.delete("/mfa/totp", async (req, res) => {
  try {
    // TODO: Implement TOTP disable
    // For now, just acknowledge the request
    res.json({ message: "TOTP disabled successfully" });
  } catch (error) {
    console.error("Disable TOTP error:", error);
    res.status(500).json({ error: "Failed to disable TOTP" });
  }
});

router.post("/account/disable", async (req, res) => {
  try {
    // TODO: Implement account disable with MFA
    // For now, just acknowledge the request
    res.json({ message: "Account disabled successfully" });
  } catch (error) {
    console.error("Disable account error:", error);
    res.status(500).json({ error: "Failed to disable account" });
  }
});

router.post(
  "/session/login",
  validateRequest(schemas.auth.login),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        presence: user.presence,
        badges: user.badges,
        flags: user.flags,
        createdAt: user.createdAt,
      };

      const tokens = generateTokens(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { status: "online", presence: "Online" },
      });

      res.json({
        user: userResponse,
        ...tokens,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { status: "offline", presence: "Offline" },
        });
      } catch (error) {
        console.error("Token verification error during logout:", error);
      }
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

export default router;
