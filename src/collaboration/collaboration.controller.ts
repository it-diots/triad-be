import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CollaborationService } from './collaboration.service';
import {
  CollaborationDocsModels,
  CommentResponseDto,
  CommentThreadResponseDto,
  CreateCommentRequestDto,
  JoinProjectResponseDto,
  MouseClickRequestDto,
  MutationProcessingResponseDto,
  ProjectSessionResponseDto,
  UpdateActivityRequestDto,
  UpdateCursorBatchRequestDto,
  UpdateCursorRequestDto,
} from './dto/collaboration-docs.dto';
import { CreateMutationDto } from './dto/create-mutation.dto';
import { CommentThread } from './entities/comment-thread.entity';
import {
  Comment,
  JoinProjectDto,
  MouseTrailDto,
  ProjectSession,
  UpdateCursorDto,
} from './types/collaboration.types';

interface AuthRequest {
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

@ApiTags('Collaboration')
@Controller('collaboration')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(...CollaborationDocsModels)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('projects/:projectId/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '프로젝트 협업 룸 참가',
    description: 'Supabase Realtime 채널에 참가하고 세션을 생성합니다',
  })
  @ApiParam({ name: 'projectId', description: '참가할 프로젝트 ID' })
  @ApiOkResponse({ description: '참가 성공', type: JoinProjectResponseDto })
  joinProject(
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ): Promise<JoinProjectResponseDto> {
    const userId = req.user.userId;
    const userInfo: JoinProjectDto = {
      username: req.user.username,
      email: req.user.email,
    };

    return this.collaborationService.joinProject(projectId, userId, userInfo);
  }

  @Delete('projects/:projectId/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '프로젝트 협업 룸 퇴장',
    description: '세션을 비활성화하고 Realtime 채널을 떠납니다',
  })
  @ApiParam({ name: 'projectId', description: '퇴장할 프로젝트 ID' })
  @ApiNoContentResponse({ description: '퇴장 성공' })
  async leaveProject(
    @Param('projectId') projectId: string,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.collaborationService.leaveProject(projectId, userId);
  }

  @Post('projects/:projectId/cursor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '커서 위치 업데이트',
    description: '실시간 마우스 좌표를 추적하고 Realtime으로 브로드캐스트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: UpdateCursorRequestDto })
  @ApiNoContentResponse({ description: '업데이트 성공' })
  async updateCursor(
    @Param('projectId') projectId: string,
    @Body() body: UpdateCursorDto,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    const username = req.user.username;
    await this.collaborationService.updateCursorPosition(projectId, userId, username, body);
  }

  @Post('projects/:projectId/cursor/batch')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '배치 마우스 좌표 업데이트',
    description: '여러 마우스 좌표를 한번에 전송하여 네트워크 효율성을 높입니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: UpdateCursorBatchRequestDto })
  @ApiNoContentResponse({ description: '배치 업데이트 성공' })
  async updateCursorBatch(
    @Param('projectId') projectId: string,
    @Body() body: MouseTrailDto,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    const username = req.user.username;
    await this.collaborationService.updateMouseBatch(projectId, userId, username, body);
  }

  @Post('projects/:projectId/click')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '마우스 클릭 이벤트',
    description: '마우스 클릭 이벤트를 브로드캐스트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: MouseClickRequestDto })
  @ApiNoContentResponse({ description: '클릭 이벤트 전송 성공' })
  async handleMouseClick(
    @Param('projectId') projectId: string,
    @Body() body: MouseClickRequestDto,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    const username = req.user.username;
    await this.collaborationService.handleMouseClick(projectId, {
      userId,
      username,
      position: body.position,
      clickType: body.clickType || 'left',
    });
  }

  @Post('projects/:projectId/activity')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '사용자 활동 상태 업데이트',
    description: '사용자의 유휴/활성 상태를 업데이트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: UpdateActivityRequestDto })
  @ApiNoContentResponse({ description: '상태 업데이트 성공' })
  async updateUserActivity(
    @Param('projectId') projectId: string,
    @Body() body: UpdateActivityRequestDto,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.collaborationService.updateUserActivity(projectId, userId, body.isActive);
  }

  @Post('projects/:projectId/comments')
  @ApiOperation({
    summary: '코멘트 생성',
    description: 'Supabase Database에 저장하고 Realtime으로 브로드캐스트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: CreateCommentRequestDto })
  @ApiCreatedResponse({ description: '코멘트 생성 성공', type: CommentResponseDto })
  createComment(
    @Param('projectId') projectId: string,
    @Body() body: CreateCommentRequestDto,
    @Request() req: AuthRequest,
  ): Promise<Comment> {
    const userId = req.user.userId;
    const username = req.user.username;

    return this.collaborationService.createComment(projectId, userId, username, body);
  }

  @Get('projects/:projectId/comments')
  @ApiOperation({
    summary: '프로젝트 코멘트 목록 조회',
    description: 'Supabase Database에서 프로젝트의 모든 코멘트를 조회합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiOkResponse({ description: '조회 성공', type: [CommentResponseDto] })
  getProjectComments(@Param('projectId') projectId: string): Promise<Comment[]> {
    return this.collaborationService.getProjectComments(projectId);
  }

  @Delete('projects/:projectId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '코멘트 삭제',
    description: 'Supabase Database에서 삭제하고 Realtime으로 삭제 이벤트를 브로드캐스트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiParam({ name: 'commentId', description: '삭제할 코멘트 ID' })
  @ApiNoContentResponse({ description: '삭제 성공' })
  async deleteComment(
    @Param('projectId') projectId: string,
    @Param('commentId') commentId: string,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const userId = req.user.userId;
    await this.collaborationService.deleteComment(projectId, commentId, userId);
  }

  @Patch('projects/:projectId/comments/:commentId/resolve')
  @ApiOperation({
    summary: '코멘트 해결 상태 토글',
    description: '코멘트의 해결 상태를 토글하고 Realtime으로 브로드캐스트합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiParam({ name: 'commentId', description: '코멘트 ID' })
  @ApiOkResponse({ description: '상태 업데이트 성공', type: CommentResponseDto })
  toggleCommentResolved(
    @Param('projectId') projectId: string,
    @Param('commentId') commentId: string,
    @Request() req: AuthRequest,
  ): Promise<Comment> {
    const userId = req.user.userId;
    return this.collaborationService.toggleCommentResolved(projectId, commentId, userId);
  }

  @Get('projects/:projectId/sessions')
  @ApiOperation({
    summary: '활성 세션 목록 조회',
    description: 'Supabase Database에서 프로젝트의 활성 세션을 조회합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiOkResponse({ description: '조회 성공', type: [ProjectSessionResponseDto] })
  getActiveSessions(@Param('projectId') projectId: string): Promise<ProjectSession[]> {
    return this.collaborationService.getActiveSessions(projectId);
  }

  @Post('projects/:projectId/mutations')
  @ApiOperation({
    summary: '협업 좌표 데이터 저장',
    description: 'Vercel Comments와 같은 협업 좌표 데이터를 저장합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiBody({ type: CreateMutationDto })
  @ApiCreatedResponse({ description: 'Mutation 처리 성공', type: MutationProcessingResponseDto })
  processMutations(
    @Param('projectId') projectId: string,
    @Body() body: CreateMutationDto,
  ): Promise<MutationProcessingResponseDto> {
    return this.collaborationService.processMutations(projectId, body);
  }

  @Get('projects/:projectId/comment-threads')
  @ApiOperation({
    summary: '코멘트 스레드 목록 조회',
    description: '프로젝트의 모든 코멘트 스레드를 좌표 정보와 함께 조회합니다',
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID' })
  @ApiOkResponse({ description: '조회 성공', type: [CommentThreadResponseDto] })
  getCommentThreads(@Param('projectId') projectId: string): Promise<CommentThread[]> {
    return this.collaborationService.getCommentThreads(projectId);
  }
}
