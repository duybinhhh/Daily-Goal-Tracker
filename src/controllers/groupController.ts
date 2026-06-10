// src/controllers/groupController.ts
import { Response, NextFunction } from "express";
import { db } from "../../server/db";
import { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { syncAndResetGoalProgress } from "./goalController";

// Get all groups
export const getGroups = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const groups = await db.groups.findMany();
    
    // Format response to include member counts
    const formattedGroups = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      creator_id: group.creator_id,
      goal_title: group.goal_title,
      goal_category: group.goal_category,
      goal_target_count: group.goal_target_count,
      goal_frequency: group.goal_frequency,
      created_at: group.created_at,
      invite_code: group.invite_code,
      invite_expires_at: group.invite_expires_at,
      max_members: group.max_members,
      memberCount: group.members.length,
      isJoined: group.members.some((m: any) => m.user_id === userId),
    }));

    res.status(200).json({
      success: true,
      groups: formattedGroups,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new group
export const createGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized access.", 401);

    const { name, description, goal_title, goal_category, goal_target_count, goal_frequency } = req.body;

    if (!name || !goal_title || !goal_category) {
      throw new AppError("Group name, goal title, and category are required.", 400);
    }

    const targetCount = goal_target_count ? parseInt(goal_target_count, 10) : 1;
    if (isNaN(targetCount) || targetCount <= 0) {
      throw new AppError("Target count must be a positive integer.", 400);
    }

    // 1. Create the HabitGroup
    const group = await db.groups.create({
      name,
      description: description || null,
      creator_id: userId,
      goal_title,
      goal_category,
      goal_target_count: targetCount,
      goal_frequency: goal_frequency || "daily",
    });

    // 2. Add creator as member
    await db.groupMembers.create({
      group_id: group.id,
      user_id: userId,
    });

    // 3. Create personal goal for creator linked to this group
    const goal = await db.goals.create({
      user_id: userId,
      title: goal_title,
      description: description ? `Group Habit: ${description}` : `Habit Group Goal: ${name}`,
      category: goal_category,
      target_count: targetCount,
      frequency: goal_frequency || "daily",
      due_date: null,
      group_id: group.id,
    });

    // 4. Create default streak
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id,
    });

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    next(error);
  }
};

// Get group details and member progress
export const getGroupById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    // Get all user goals linked to this group
    const goals = await db.goals.findMany();
    const groupGoals = goals.filter((g: any) => g.group_id === group.id);

    // Build progress dashboard for each member
    const membersProgress = await Promise.all(
      group.members.map(async (m: any) => {
        const memberUser = m.user;
        const memberGoal = groupGoals.find((g: any) => g.user_id === memberUser.id);
        
        let current_count = 0;
        let target_count = group.goal_target_count;
        let streak = { current_streak: 0, longest_streak: 0 };
        let status = "active";

        if (memberGoal) {
          // Sync and reset member's goal progress in their respective timezone
          const syncedGoal = await syncAndResetGoalProgress(memberGoal, memberUser.timezone || "UTC");
          current_count = syncedGoal.current_count;
          target_count = syncedGoal.target_count;
          status = syncedGoal.status;

          const memberStreak = await db.streaks.findUnique({ goal_id: syncedGoal.id });
          if (memberStreak) {
            streak = {
              current_streak: memberStreak.current_streak,
              longest_streak: memberStreak.longest_streak,
            };
          }
        }

        return {
          user_id: memberUser.id,
          name: memberUser.name,
          email: memberUser.email,
          current_count,
          target_count,
          streak,
          status,
        };
      })
    );

    const isJoined = group.members.some((m: any) => m.user_id === userId);

    res.status(200).json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        creator_id: group.creator_id,
        creator_name: group.creator.name,
        goal_title: group.goal_title,
        goal_category: group.goal_category,
        goal_target_count: group.goal_target_count,
        goal_frequency: group.goal_frequency,
        invite_code: group.invite_code,
        invite_expires_at: group.invite_expires_at,
        max_members: group.max_members,
        created_at: group.created_at,
        isJoined,
        members: membersProgress,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to generate a random 8-character invite code
function generateInviteCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Create invite link (Admin only)
export const createInviteCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can generate invite links.", 403);
    }

    if (group.members.length >= group.max_members) {
      throw new AppError(`Nhóm đã đủ ${group.max_members} thành viên, không thể tạo link mời.`, 400);
    }

    let inviteCode = generateInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const existing = await db.groups.findByInviteCode(inviteCode);
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
        attempts++;
      }
    }

    if (!isUnique) {
      throw new AppError("Could not generate a unique invite code. Please try again.", 500);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.groups.update(id, {
      invite_code: inviteCode,
      invite_expires_at: expiresAt,
    });

    res.status(200).json({
      success: true,
      inviteCode,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Get group info by invite code
export const getGroupByInviteCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { inviteCode } = req.params;

    const group = await db.groups.findByInviteCode(inviteCode);
    if (!group) {
      throw new AppError("Link mời không hợp lệ.", 404);
    }

    const now = new Date();
    if (group.invite_expires_at && new Date(group.invite_expires_at) < now) {
      return res.status(200).json({
        success: true,
        status: "expired",
        message: "Link mời đã hết hạn.",
      }) as any;
    }

    if (group.members.length >= group.max_members) {
      return res.status(200).json({
        success: true,
        status: "full",
        message: "Nhóm đã đầy.",
      }) as any;
    }

    res.status(200).json({
      success: true,
      status: "valid",
      group: {
        id: group.id,
        name: group.name,
        memberCount: group.members.length,
        maxMembers: group.max_members,
      },
      expiresAt: group.invite_expires_at,
    });
  } catch (error) {
    next(error);
  }
};

// Join group via invite code
export const joinGroupByInviteCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { inviteCode } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findByInviteCode(inviteCode);
    if (!group) {
      throw new AppError("Link mời không hợp lệ.", 404);
    }

    const now = new Date();
    if (group.invite_expires_at && new Date(group.invite_expires_at) < now) {
      throw new AppError("Link mời đã hết hạn.", 400);
    }

    if (group.members.length >= group.max_members) {
      throw new AppError("Nhóm đã đầy.", 400);
    }

    const isMember = group.members.some((m: any) => m.user_id === userId);
    if (isMember) {
      return res.status(200).json({
        success: true,
        alreadyMember: true,
        groupId: group.id,
        message: "Bạn đã là thành viên của nhóm này.",
      }) as any;
    }

    // 1. Add membership
    await db.groupMembers.create({
      group_id: group.id,
      user_id: userId,
    });

    // 2. Create personal goal linked to this group
    const goal = await db.goals.create({
      user_id: userId,
      title: group.goal_title,
      description: group.description ? `Group Habit: ${group.description}` : `Habit Group Goal: ${group.name}`,
      category: group.goal_category,
      target_count: group.goal_target_count,
      frequency: group.goal_frequency,
      due_date: null,
      group_id: group.id,
    });

    // 3. Create default streak
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id,
    });

    res.status(200).json({
      success: true,
      groupId: group.id,
      message: "Đã tham gia nhóm!",
    });
  } catch (error) {
    next(error);
  }
};

// Join a group
export const joinGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    if (group.members.length >= group.max_members) {
      throw new AppError("Nhóm đã đầy.", 400);
    }

    const isMember = group.members.some((m: any) => m.user_id === userId);
    if (isMember) {
      throw new AppError("You are already a member of this group.", 400);
    }

    // 1. Add membership
    await db.groupMembers.create({
      group_id: group.id,
      user_id: userId,
    });

    // 2. Create personal goal linked to this group
    const goal = await db.goals.create({
      user_id: userId,
      title: group.goal_title,
      description: group.description ? `Group Habit: ${group.description}` : `Habit Group Goal: ${group.name}`,
      category: group.goal_category,
      target_count: group.goal_target_count,
      frequency: group.goal_frequency,
      due_date: null,
      group_id: group.id,
    });

    // 3. Create default streak
    await db.streaks.create({
      user_id: userId,
      goal_id: goal.id,
    });

    res.status(200).json({
      success: true,
      message: "Successfully joined the habit group.",
    });
  } catch (error) {
    next(error);
  }
};

// Leave a group
export const leaveGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    const isMember = group.members.some((m: any) => m.user_id === userId);
    if (!isMember) {
      throw new AppError("You are not a member of this group.", 400);
    }

    // 1. Delete membership
    await db.groupMembers.delete({
      group_id: group.id,
      user_id: userId,
    });

    // 2. Delete personal goal and streaks
    const goals = await db.goals.findMany();
    const groupGoal = goals.find((g: any) => g.group_id === group.id && g.user_id === userId);
    if (groupGoal) {
      await db.goals.delete(groupGoal.id);
    }

    res.status(200).json({
      success: true,
      message: "Successfully left the habit group.",
    });
  } catch (error) {
    next(error);
  }
};

// Remove a member from a group (Admin only)
export const removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id, userId: targetUserId } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can remove members.", 403);
    }

    if (targetUserId === userId) {
      throw new AppError("You cannot remove yourself. Use 'Leave Group' instead.", 400);
    }

    const isMember = group.members.some((m: any) => m.user_id === targetUserId);
    if (!isMember) {
      throw new AppError("User is not a member of this group.", 400);
    }

    // 1. Delete membership
    await db.groupMembers.delete({
      group_id: group.id,
      user_id: targetUserId,
    });

    // 2. Delete personal goal and streaks
    const goals = await db.goals.findMany();
    const groupGoal = goals.find((g: any) => g.group_id === group.id && g.user_id === targetUserId);
    if (groupGoal) {
      await db.goals.delete(groupGoal.id);
    }

    res.status(200).json({
      success: true,
      message: "Member successfully removed from the group.",
    });
  } catch (error) {
    next(error);
  }
};

// Delete a group
export const deleteGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) throw new AppError("Unauthorized access.", 401);

    const group = await db.groups.findUnique({ id });
    if (!group) {
      throw new AppError("Group not found.", 404);
    }

    if (group.creator_id !== userId) {
      throw new AppError("Only the group creator can delete this group.", 403);
    }

    // Delete the group (memberships and goals' group_ids will cascade delete or set null)
    await db.groups.delete(id);

    res.status(200).json({
      success: true,
      message: "Group successfully deleted.",
    });
  } catch (error) {
    next(error);
  }
};
