
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import webpush from "web-push";

// Get messages for a group
export const getGroupMessages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!userId) throw new AppError("Unauthorized.", 401);

    // Check membership
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }

    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);

    const messages = await db.groupMessages.findMany({ group_id: groupId });

    const formattedMessages = messages.map((msg: any) => {
      const reactionCounts: Record<string, number> = {
        "🔥": 0, "💪": 0, "👏": 0, "❤️": 0, "😂": 0
      };
      const myReactions: string[] = [];
      
      msg.reactions.forEach((r: any) => {
        if (reactionCounts[r.emoji] !== undefined) {
          reactionCounts[r.emoji]++;
          if (r.user_id === userId) {
            myReactions.push(r.emoji);
          }
        }
      });

      return {
        id: msg.id,
        groupId: msg.group_id,
        senderId: msg.sender_id,
        senderName: msg.sender?.name,
        senderAvatarInitials: msg.sender?.avatarInitials,
        content: msg.content,
        createdAt: msg.created_at,
        canDelete: userId === msg.sender_id || userId === group.creator_id,
        reactions: reactionCounts,
        myReactions,
      };
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error) {
    next(error);
  }
};

// Send a message to a group
export const sendGroupMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    const { content } = req.body;

    if (!userId) throw new AppError("Unauthorized.", 401);
    if (!content || content.trim().length === 0) {
      throw new AppError("Message content cannot be empty.", 400);
    }
    if (content.trim().length > 200) {
      throw new AppError("Message content cannot exceed 200 characters.", 400);
    }

    // Check membership
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }

    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);

    const message = await db.groupMessages.create({
      group_id: groupId,
      sender_id: userId,
      content: content.trim(),
    });

    // Response immediately for better UX (though push happens after)
    res.status(201).json({
      success: true,
      message: {
        ...message,
        reactions: { "🔥": 0, "💪": 0, "👏": 0, "❤️": 0, "😂": 0 },
        myReactions: [],
        canDelete: true,
        senderName: req.user?.name,
        senderAvatarInitials: message.sender?.avatarInitials
      },
    });

    // Background: Push Notifications
    sendGroupChatNotifications(groupId, userId, content.trim(), group.name, req.user?.name || "Someone").catch(err => {
      console.error("[Push Notification] Error sending group chat notifications:", err);
    });

  } catch (error) {
    next(error);
  }
};

// Toggle a reaction on a message
export const toggleReaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    const { emoji } = req.body;

    if (!userId) throw new AppError("Unauthorized.", 401);
    const allowedEmojis = ["🔥", "💪", "👏", "❤️", "😂"];
    if (!allowedEmojis.includes(emoji)) {
      throw new AppError("Invalid emoji reaction.", 400);
    }

    // Check membership
    const membership = await db.groupMembers.findMany({ group_id: groupId, user_id: userId });
    if (membership.length === 0) {
      throw new AppError("You are not a member of this group.", 403);
    }

    await db.messageReactions.toggle(messageId, userId, emoji);

    // Fetch updated counts
    const message = await db.groupMessages.findUnique(messageId);
    if (!message) throw new AppError("Message not found.", 404);

    const reactionCounts: Record<string, number> = {
      "🔥": 0, "💪": 0, "👏": 0, "❤️": 0, "😂": 0
    };
    const myReactions: string[] = [];

    message.reactions.forEach((r: any) => {
      if (reactionCounts[r.emoji] !== undefined) {
        reactionCounts[r.emoji]++;
        if (r.user_id === userId) {
          myReactions.push(r.emoji);
        }
      }
    });

    res.status(200).json({
      success: true,
      reactions: reactionCounts,
      myReactions,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a message
export const deleteMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { groupId, messageId } = req.params;
    if (!userId) throw new AppError("Unauthorized.", 401);

    const message = await db.groupMessages.findUnique(messageId);
    if (!message) throw new AppError("Message not found.", 404);

    const group = await db.groups.findUnique({ id: groupId });
    if (!group) throw new AppError("Group not found.", 404);

    // Authorization: Sender or Group Creator
    const canDelete = userId === message.sender_id || userId === group.creator_id;
    if (!canDelete) {
      throw new AppError("You do not have permission to delete this message.", 403);
    }

    await db.groupMessages.delete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Send push notifications to group members
async function sendGroupChatNotifications(groupId: string, senderId: string, content: string, groupName: string, senderName: string) {
  try {
    const group = await db.groups.findUnique({ id: groupId });
    if (!group) return;

    // Filter members (except sender) who have push subscription
    const members = group.members.filter((m: any) => m.user_id !== senderId && m.user.push_subscription);

    const truncatedContent = content.length > 50 ? content.substring(0, 47) + "..." : content;
    const payload = JSON.stringify({
      title: `Tin nhắn mới trong nhóm ${groupName}`,
      body: `${senderName}: ${truncatedContent}`,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: `/#/groups?id=${groupId}` },
    });

    for (const member of members) {
      // AC-6: Limit max 3 group chat notifications per user per day
      const countToday = await db.groupChatNotificationLogs.countToday(member.user_id);
      if (countToday >= 3) {
        console.log(`[Push Notification] User ${member.user_id} reached daily limit for group chat notifications.`);
        continue;
      }

      try {
        const subscription = JSON.parse(member.user.push_subscription);
        await webpush.sendNotification(subscription, payload);
        
        // Log the notification
        await db.groupChatNotificationLogs.create(member.user_id, groupId);
      } catch (pushErr: any) {
        console.error(`[Push Notification] Failed for user ${member.user_id}:`, pushErr.message);
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await db.users.update(member.user_id, { push_subscription: null });
        }
      }
    }
  } catch (err) {
    console.error("[Push Notification] sendGroupChatNotifications failed:", err);
  }
}
