import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/server/:serverId', authenticateToken, async (req, res) => {
  try {
    const { serverId } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
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
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or no permission' });
    }

    const channels = await prisma.channel.findMany({
      where: { serverId },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

router.post('/server/:serverId', authenticateToken, validateRequest(schemas.channel.create), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, description, type } = req.body;

    const server = await prisma.server.findFirst({
      where: {
        id: serverId,
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
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or no permission' });
    }

    const channelCount = await prisma.channel.count({
      where: { serverId },
    });

    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        type,
        serverId,
        position: channelCount,
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.channel.findFirst({
      where: {
        id,
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
      include: {
        server: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or no permission' });
    }

    res.json(channel);
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

router.patch('/:id', authenticateToken, validateRequest(schemas.channel.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const channel = await prisma.channel.findFirst({
      where: {
        id,
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
      include: {
        server: true,
      },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or no permission' });
    }

    const updatedChannel = await prisma.channel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
      },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    res.json(updatedChannel);
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const channel = await prisma.channel.findFirst({
      where: {
        id,
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
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found or no permission' });
    }

    await prisma.channel.delete({
      where: { id },
    });

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

export default router;
