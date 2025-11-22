import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Additional security check to ensure user can only delete their own sessions
  const targetSession = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    select: { userId: true },
  });

  if (!targetSession || targetSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Deactivate a specific session deactivateSession
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      expires: new Date(),
    },
  });

  // Deactivate all sessions except the current one (deactivateOtherSessions)
  // await prisma.session.updateMany({
  //   where: {
  //     userId: session.user.id,
  //     id: {
  //       not: sessionId
  //     },
  //     isActive: true
  //   },
  //   data: { isActive: false }
  // });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const session = await auth();

  // if (!session?.user || !session.sessionId) {
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, deviceName } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Additional security check to ensure user can only update their own sessions
  const targetSession = await prisma.session.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!targetSession || targetSession.userId !== session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update session metadata (sessionId: string, metadata: { deviceName?: string }
  // await prisma.session.update({
  //   where: { id: sessionId },
  //   data: metadata,
  // });

  // If updating current session, also update the session directly
  // if (id === session.sessionId) {
  //   await fetch('/api/auth/session', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ deviceName })
  //   });
  // }

  return NextResponse.json({ success: true });
}

// Clean up expired sessions (could be run on a schedule)
// async cleanupExpiredSessions() {
//   return await prisma.userSession.updateMany({
//     where: {
//       expiresAt: {
//         lt: new Date(),
//       },
//       isActive: true,
//     },
//     data: { isActive: false },
//   });
// }
