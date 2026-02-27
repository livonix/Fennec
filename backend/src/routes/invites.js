import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import prisma from '../config/database.js';
import { ulid } from 'ulid';

const router = express.Router();

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        server: {
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
        },
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(410).json({ error: 'Invite has expired' });
    }

    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res.status(410).json({ error: 'Invite has reached maximum uses' });
    }

    const response = {
      type: 'Server',
      server: invite.server,
      code: invite.code,
      creator: invite.creator,
      uses: invite.uses,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
    };

    res.json(response);
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ error: 'Failed to fetch invite' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { serverId, maxUses, expiresAt } = req.body;

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

    const code = ulid().toLowerCase().slice(0, 8);

    const invite = await prisma.invite.create({
      data: {
        code,
        serverId,
        creatorId: req.user.id,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(invite);
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

router.post('/:code/join', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        server: true,
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(410).json({ error: 'Invite has expired' });
    }

    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res.status(410).json({ error: 'Invite has reached maximum uses' });
    }

    const existingMember = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId: invite.serverId,
          userId: req.user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    await prisma.$transaction([
      prisma.serverMember.create({
        data: {
          serverId: invite.serverId,
          userId: req.user.id,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: {
          uses: {
            increment: 1,
          },
        },
      }),
    ]);

    const server = await prisma.server.findUnique({
      where: { id: invite.serverId },
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

    res.status(201).json(server);
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Failed to join server' });
  }
});

export default router;
