import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const inviteData = {
      id: bot.id,
      name: bot.name,
      description: bot.description,
      avatar: bot.avatar,
      owner: bot.owner,
      publicKey: bot.publicKey,
      flags: bot.flags,
      createdAt: bot.createdAt,
    };

    res.json(inviteData);
  } catch (error) {
    console.error('Get bot invite error:', error);
    res.status(500).json({ error: 'Failed to fetch bot invite' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const bots = await prisma.bot.findMany({
      where: { ownerId: req.user.id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(bots);
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, avatar } = req.body;

    const bot = await prisma.bot.create({
      data: {
        name,
        description,
        avatar,
        ownerId: req.user.id,
        token: `bot_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(bot);
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or no permission' });
    }

    res.json(bot);
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({ error: 'Failed to fetch bot' });
  }
});

router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, avatar } = req.body;

    const bot = await prisma.bot.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or no permission' });
    }

    const updatedBot = await prisma.bot.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(avatar && { avatar }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.json(updatedBot);
  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({ error: 'Failed to update bot' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await prisma.bot.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found or no permission' });
    }

    await prisma.bot.delete({
      where: { id },
    });

    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

export default router;
