import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, EscalateReportDto, ResolveReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.createReport(userId, dto);
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  async findReports(
    @CurrentUser('role') role: string,
    @Query('status') status?: string,
    @Query('escalationLevel') escalationLevel?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reportsService.findReports(role, {
      status,
      escalationLevel,
      targetType,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get(':id')
  async getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Patch(':id/escalate')
  async escalateReport(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: EscalateReportDto,
  ) {
    return this.reportsService.escalateReport(userId, role, id, dto);
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/resolve')
  async resolveReport(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolveReport(userId, role, id, dto, false);
  }

  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/dismiss')
  async dismissReport(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolveReport(userId, role, id, dto, true);
  }
}
