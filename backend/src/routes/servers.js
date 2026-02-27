import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, schemas } from '../middleware/validation.js';
import prisma from '../config/database.js';
import { ulid } from 'ulid';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const servers = await prisma.server.findMany({
      where: {
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
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          where: {
            userId: req.user.id,
          },
          select: {
            nickname: true,
            roles: true,
            joinedAt: true,
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    res.json(servers);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

router.post('/', authenticateToken, validateRequest(schemas.server.create), async (req, res) => {
  try {
    const { name, description } = req.body;

    const server = await prisma.server.create({
      data: {
        name,
        description,
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
        members: {
          where: {
            userId: req.user.id,
          },
          select: {
            nickname: true,
            roles: true,
            joinedAt: true,
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            type: true,
            position: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    await prisma.serverMember.create({
      data: {
        serverId: server.id,
        userId: req.user.id,
        roles: ['owner'],
      },
    });

    await prisma.channel.create({
      data: {
        name: 'general',
        type: 'Text',
        serverId: server.id,
        position: 0,
      },
    });

    res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Failed to create server' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id,
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
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                status: true,
                presence: true,
              },
            },
          },
        },
        channels: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            icon: true,
            position: true,
            createdAt: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(server);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Failed to fetch server' });
  }
});

router.patch('/:id', authenticateToken, validateRequest(schemas.server.update), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, banner } = req.body;

    const server = await prisma.server.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or no permission' });
    }

    const updatedServer = await prisma.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(banner && { banner }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
    });

    res.json(updatedServer);
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Failed to update server' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const server = await prisma.server.findFirst({
      where: {
        id,
        ownerId: req.user.id,
      },
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or no permission' });
    }

    await prisma.server.delete({
      where: { id },
    });

    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

export default router;
