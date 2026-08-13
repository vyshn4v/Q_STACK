import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { CastVoteDto } from './dto/vote.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post()
  async castVote(
    @CurrentUser('userId') userId: string,
    @Body() dto: CastVoteDto,
  ) {
    return this.votesService.castVote(userId, dto);
  }
}
