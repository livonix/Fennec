import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import prisma from '../config/database.js';
import { ulid } from 'ulid';

const router = express.Router();

router.get('/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        server: {
          OR: [
            { ownerId: req.user.id },
            {
              members: {
                some: {
                  userId: req.user.id,
                },
              },
            },
          ],
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or no permission' });
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            presence: true,
            badges: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(parseInt(limit), 100),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/channel/:channelId', authenticateToken, validateRequest(schemas.message.create), async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, attachments, nonce } = req.body;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        server: {
          OR: [
            { ownerId: req.user.id },
            {
              members: {
                some: {
                  userId: req.user.id,
                },
              },
            },
          ],
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or no permission' });
    }

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        authorId: req.user.id,
        attachments: attachments || [],
        nonce: nonce || ulid(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            presence: true,
            badges: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        channel: {
          server: {
            OR: [
              { ownerId: req.user.id },
              {
                members: {
                  some: {
                    userId: req.user.id,
                  },
                },
              },
            ],
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            presence: true,
            badges: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or no permission' });
    }

    res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

router.patch('/:id', authenticateToken, validateRequest(schemas.message.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await prisma.message.findFirst({
      where: {
        id,
        authorId: req.user.id,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or no permission' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            status: true,
            presence: true,
            badges: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    res.json(updatedMessage);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        channel: {
          server: {
            OR: [
              { ownerId: req.user.id },
              {
                members: {
                  some: {
                    userId: req.user.id,
                    roles: {
                      hasSome: ['owner', 'admin'],
                    },
                  },
                },
              },
            ],
          },
        },
      },
      include: {
        channel: {
          include: {
            server: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or no permission' });
    }

    const canDelete = message.authorId === req.user.id || 
                     message.channel.server.ownerId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'No permission to delete this message' });
    }

    await prisma.message.delete({
      where: { id },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
