import { CommentThread } from '../../collaboration/entities/comment-thread.entity';
import { Comment } from '../../collaboration/entities/comment.entity';
import { ProjectSession } from '../../collaboration/entities/project-session.entity';
import { Project } from '../../collaboration/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import {
  CommentResponseDto,
  CommentThreadResponseDto,
  ProjectResponseDto,
  ProjectSessionResponseDto,
  UserProfileResponseDto,
  UserResponseDto,
  UserSummaryResponseDto,
} from '../dto/response.dto';

/**
 * 공통 Transform 유틸리티 클래스
 * 엔티티를 DTO로 변환하는 메서드들을 제공
 */
export class TransformUtil {
  /**
   * User 엔티티를 UserResponseDto로 변환
   */
  static toUserResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      provider: user.provider,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
    };
  }

  /**
   * User 엔티티를 UserProfileResponseDto로 변환
   */
  static toUserProfileResponseDto(user: User): UserProfileResponseDto {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * User 엔티티를 UserSummaryResponseDto로 변환
   */
  static toUserSummaryResponseDto(user: User): UserSummaryResponseDto {
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    };
  }

  /**
   * Project 엔티티를 ProjectResponseDto로 변환
   */
  static toProjectResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      url: project.url,
      domain: project.domain,
      isPublic: project.isPublic,
      ownerId: project.ownerId,
      settings: project.settings,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      deletedAt: project.deletedAt,
      owner: project.owner ? this.toUserSummaryResponseDto(project.owner) : undefined,
    };
  }

  /**
   * Comment 엔티티를 CommentResponseDto로 변환
   */
  static toCommentResponseDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      projectId: comment.projectId,
      userId: comment.userId,
      threadId: comment.threadId,
      content: comment.content,
      images: comment.images || [],
      position: comment.position,
      parentId: comment.parentId,
      isResolved: comment.isResolved,
      resolvedAt: comment.resolvedAt,
      resolvedBy: comment.resolvedBy,
      url: comment.url,
      xpath: comment.xpath,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      deletedAt: comment.deletedAt,
      user: comment.user ? this.toUserSummaryResponseDto(comment.user) : undefined,
      resolver: comment.resolver ? this.toUserSummaryResponseDto(comment.resolver) : undefined,
      replies: comment.replies
        ? comment.replies.map((reply) => this.toCommentResponseDto(reply as Comment))
        : [],
    };
  }

  /**
   * CommentThread 엔티티를 CommentThreadResponseDto로 변환
   */
  static toCommentThreadResponseDto(thread: CommentThread): CommentThreadResponseDto {
    return {
      id: thread.id,
      projectId: thread.projectId,
      url: thread.url,
      pageTitle: thread.pageTitle,
      isResolved: thread.isResolved,
      resolvedAt: thread.resolvedAt,
      resolvedBy: thread.resolvedBy,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      deletedAt: thread.deletedAt,
      resolver: thread.resolver
        ? this.toUserSummaryResponseDto(thread.resolver as User)
        : undefined,
      comments: thread.comments
        ? (thread.comments as Comment[]).map((comment) => this.toCommentResponseDto(comment))
        : [],
    };
  }

  /**
   * ProjectSession 엔티티를 ProjectSessionResponseDto로 변환
   */
  static toProjectSessionResponseDto(session: ProjectSession): ProjectSessionResponseDto {
    return {
      id: session.id,
      projectId: session.projectId,
      userId: session.userId,
      username: session.username,
      userEmail: session.userEmail,
      userAvatar: session.userAvatar,
      isActive: session.isActive,
      cursorPosition: session.cursorPosition,
      lastActivity: session.lastActivity,
      joinedAt: session.joinedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      user: session.user ? this.toUserSummaryResponseDto(session.user) : undefined,
    };
  }
}
