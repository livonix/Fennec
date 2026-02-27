import { z } from "zod";

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const schemas = {
  auth: {
    createAccount: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8).max(128),
        captcha: z.string().optional(),
      }),
    },
    register: {
      body: z.object({
        username: z.string().min(3).max(32),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      }),
    },
    login: {
      body: z.object({
        username: z.string().min(3).max(32).optional(),
        email: z.string().email(),
        password: z.string().min(1),
      }),
    },
  },
  user: {
    update: {
      body: z
        .object({
          username: z.string().min(3).max(32).optional(),
          avatar: z.string().url().optional(),
          status: z.enum(["online", "idle", "busy", "invisible"]).optional(),
          presence: z.enum(["Online", "Idle", "Busy", "Invisible"]).optional(),
          profile: z.object({}).optional(),
        })
        .partial(),
    },
  },
  server: {
    create: {
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }),
    },
    update: {
      params: z.object({
        id: z.string().cuid(),
      }),
      body: z
        .object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).optional(),
          icon: z.string().url().optional(),
          banner: z.string().url().optional(),
        })
        .partial(),
    },
  },
  channel: {
    create: {
      params: z.object({
        serverId: z.string().cuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        type: z.enum(["Text", "Voice"]).default("Text"),
      }),
    },
    update: {
      params: z.object({
        id: z.string().cuid(),
      }),
      body: z
        .object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).optional(),
          icon: z.string().url().optional(),
        })
        .partial(),
    },
  },
  message: {
    create: {
      params: z.object({
        channelId: z.string().cuid(),
      }),
      body: z.object({
        content: z.string().min(1).max(2000),
        attachments: z.array(z.object({}).optional()).optional(),
        nonce: z.string().optional(),
      }),
    },
    update: {
      params: z.object({
        id: z.string().cuid(),
      }),
      body: z.object({
        content: z.string().min(1).max(2000),
      }),
    },
  },
};
