import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Public()
  @Get('badges')
  async getBadgeCatalog() {
    return this.reputationService.getBadgeCatalog();
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getUserReputationHistory(
    @CurrentUser('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    return this.reputationService.getUserReputationHistory(userId, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cron-runs')
  async getCronRuns(@Query('limit') limit?: string) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    return this.reputationService.getCronRuns(limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('run-cron')
  async triggerCronJobManually() {
    return this.reputationService.runReputationCalculationJob('manual_trigger');
  }
}
