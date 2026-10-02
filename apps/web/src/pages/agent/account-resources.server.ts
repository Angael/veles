import { eq, inArray, sql } from 'drizzle-orm';
import {
  connectionInvitations,
  userConnections,
  users,
  userSharingSettings,
} from '@veles/db/schema';
import { db } from '@/server/db.server';
import { defineAgentResource } from './resource.server';

export const accountResources = [
  defineAgentResource(
    'profile',
    'Your profile. Authentication accounts, sessions, tokens, and verification secrets are excluded.',
    users,
    {
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    },
    users.id,
    (userId) => eq(users.id, userId),
  ),
  defineAgentResource(
    'sharing_settings',
    'Your feature sharing preferences. No record means all sharing is disabled. id is your userId.',
    userSharingSettings,
    {
      shareCalories: userSharingSettings.shareCalories,
      shareWeight: userSharingSettings.shareWeight,
      shareRecipes: userSharingSettings.shareRecipes,
      updatedAt: userSharingSettings.updatedAt,
    },
    userSharingSettings.userId,
    (userId) => eq(userSharingSettings.userId, userId),
  ),
  defineAgentResource(
    'connections',
    'Your connection records. id is the connected user’s ID; this does not grant access to their private content.',
    userConnections,
    {
      userLowId: userConnections.userLowId,
      userHighId: userConnections.userHighId,
      createdAt: userConnections.createdAt,
    },
    (userId) =>
      sql`CASE WHEN ${userConnections.userLowId} = ${userId} THEN ${userConnections.userHighId} ELSE ${userConnections.userLowId} END`,
    (userId) =>
      sql`(${userConnections.userLowId} = ${userId} OR ${userConnections.userHighId} = ${userId})`,
  ),
  defineAgentResource(
    'connection_invitations',
    'Your sent and received connection invitations. Invitation tokens and their hashes are excluded.',
    connectionInvitations,
    {
      inviterUserId: connectionInvitations.inviterUserId,
      recipientEmail: connectionInvitations.recipientEmail,
      deliveryFailed: connectionInvitations.deliveryFailed,
      createdAt: connectionInvitations.createdAt,
      updatedAt: connectionInvitations.updatedAt,
    },
    connectionInvitations.id,
    (userId) =>
      sql`(${connectionInvitations.inviterUserId} = ${userId} OR ${inArray(
        connectionInvitations.recipientEmail,
        db.select({ email: users.email }).from(users).where(eq(users.id, userId)),
      )})`,
  ),
];
