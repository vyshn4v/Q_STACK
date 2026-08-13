import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReportsRepository, ReportRow } from './reports.repository';
import { CreateReportDto, EscalateReportDto, ResolveReportDto } from './dto/report.dto';
import { NotificationsService } from '../notifications/notifications.service';
import type { IEventBus } from '../../redis/event-bus.interface';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly notificationsService: NotificationsService,
    @Inject('IEventBus') private readonly eventBus: IEventBus,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto): Promise<ReportRow> {
    const { report, autoEscalated } = await this.reportsRepo.createReport(
      reporterId,
      dto.targetType,
      dto.targetId,
      dto.reason,
    );

    this.logger.log(`New report filed by ${reporterId} on ${dto.targetType} ${dto.targetId} (Auto-escalated: ${autoEscalated})`);

    // Publish event
    await this.eventBus.publish('reports', {
      type: autoEscalated ? 'report.escalated' : 'report.filed',
      userId: reporterId,
      timestamp: new Date().toISOString(),
      payload: {
        reportId: report.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        escalationLevel: report.escalation_level,
        status: report.status,
      },
    });

    return report;
  }

  async findReports(
    userRole: string,
    params: { status?: string; escalationLevel?: string; targetType?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));

    // Scoped visibility based on role hierarchy
    let escalationLevelFilter = params.escalationLevel;
    if (userRole === 'moderator' && !escalationLevelFilter) {
      escalationLevelFilter = 'moderator';
    }

    return this.reportsRepo.findReports({
      status: params.status,
      escalationLevel: escalationLevelFilter,
      targetType: params.targetType,
      page,
      limit,
    });
  }

  async getReportById(id: string): Promise<ReportRow> {
    const report = await this.reportsRepo.findReportById(id);
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async escalateReport(
    userId: string,
    userRole: string,
    reportId: string,
    dto: EscalateReportDto,
  ): Promise<ReportRow> {
    const report = await this.getReportById(reportId);

    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new BadRequestException('Cannot escalate a resolved or dismissed report.');
    }

    let nextLevel: 'admin' | 'super_admin';
    let nextStatus: 'admin_review' | 'super_admin_review';

    if (userRole === 'moderator') {
      nextLevel = 'admin';
      nextStatus = 'admin_review';
    } else if (userRole === 'admin') {
      nextLevel = 'super_admin';
      nextStatus = 'super_admin_review';
    } else {
      throw new ForbiddenException('Only moderators and admins can escalate reports.');
    }

    const updated = await this.reportsRepo.updateReportEscalation(reportId, nextLevel, nextStatus);

    this.logger.log(`Report ${reportId} escalated to ${nextLevel} by ${userId} (${userRole})`);

    await this.eventBus.publish('reports', {
      type: 'report.escalated',
      userId,
      timestamp: new Date().toISOString(),
      payload: {
        reportId,
        nextLevel,
        nextStatus,
        escalationReason: dto.escalationReason,
      },
    });

    return updated;
  }

  async resolveReport(
    userId: string,
    userRole: string,
    reportId: string,
    dto: ResolveReportDto,
    isDismissal = false,
  ): Promise<ReportRow> {
    const report = await this.getReportById(reportId);

    if (report.status === 'resolved' || report.status === 'dismissed') {
      throw new BadRequestException('Report is already completed.');
    }

    // Role boundary validation
    if (userRole === 'moderator' && report.escalation_level !== 'moderator') {
      throw new ForbiddenException('Moderators can only resolve reports at the moderator tier.');
    }

    const finalStatus = isDismissal ? 'dismissed' : 'resolved';
    const updated = await this.reportsRepo.resolveReport(
      reportId,
      userId,
      dto.actionTaken,
      finalStatus,
    );

    // Notify reporter
    await this.notificationsService.createNotification(report.reporter_id, 'report.resolved', {
      message: `Your report regarding a ${report.target_type} has been reviewed and marked as ${finalStatus}.`,
      actionTaken: dto.actionTaken,
      targetType: report.target_type,
    });

    return updated;
  }
}
