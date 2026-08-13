import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validate } from './config/config.validation';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Domain Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TagsModule } from './modules/tags/tags.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AnswersModule } from './modules/answers/answers.module';
import { CommentsModule } from './modules/comments/comments.module';
import { VotesModule } from './modules/votes/votes.module';
import { MedalsModule } from './modules/medals/medals.module';
import { FollowsModule } from './modules/follows/follows.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReputationModule } from './modules/reputation/reputation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env', 'local.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    TagsModule,
    QuestionsModule,
    AnswersModule,
    CommentsModule,
    VotesModule,
    MedalsModule,
    FollowsModule,
    BookmarksModule,
    NotificationsModule,
    ReputationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
