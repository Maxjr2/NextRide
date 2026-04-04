/**
 * Dependency injection container.
 * Wires up either Prisma or Mock repositories based on MOCK_MODE.
 */
import { config } from './index';
import { logger } from './logger';

// Repositories
import type {
  IUserRepository,
  IFacilityRepository,
  IVehicleRepository,
  IPostRepository,
  IMatchRepository,
  IRideLogRepository,
} from '../repositories/interfaces';

// Services
import { PostService } from '../services/PostService';
import { MatchService } from '../services/MatchService';
import { VehicleService } from '../services/VehicleService';
import { UserService } from '../services/UserService';
import { FacilityService } from '../services/FacilityService';

// Notifications
import type { INotificationService } from '../notifications/INotificationService';

export interface Container {
  repos: {
    users: IUserRepository;
    facilities: IFacilityRepository;
    vehicles: IVehicleRepository;
    posts: IPostRepository;
    matches: IMatchRepository;
    rideLogs: IRideLogRepository;
  };
  services: {
    posts: PostService;
    matches: MatchService;
    vehicles: VehicleService;
    users: UserService;
    facilities: FacilityService;
  };
  notifications: INotificationService;
}

export function buildContainer(): Container {
  let repos: Container['repos'];
  let notifications: INotificationService;

  if (config.mockMode) {
    logger.warn('⚠️  MOCK_MODE is enabled — using in-memory data, no DB or Keycloak required');

    const { MockStore, MockUserRepository, MockFacilityRepository, MockVehicleRepository, MockPostRepository, MockMatchRepository, MockRideLogRepository } =
      require('../repositories/mock/MockRepositories');
    const { MockNotificationService } = require('../notifications/MockNotificationService');

    const store = new MockStore();
    repos = {
      users: new MockUserRepository(store),
      facilities: new MockFacilityRepository(store),
      vehicles: new MockVehicleRepository(store),
      posts: new MockPostRepository(store),
      matches: new MockMatchRepository(store),
      rideLogs: new MockRideLogRepository(store),
    };
    notifications = new MockNotificationService();
  } else {
    const { PrismaUserRepository } = require('../repositories/prisma/UserRepository');
    const { PrismaFacilityRepository } = require('../repositories/prisma/FacilityRepository');
    const { PrismaVehicleRepository } = require('../repositories/prisma/VehicleRepository');
    const { PrismaPostRepository } = require('../repositories/prisma/PostRepository');
    const { PrismaMatchRepository } = require('../repositories/prisma/MatchRepository');
    const { PrismaRideLogRepository } = require('../repositories/prisma/RideLogRepository');
    const { SmtpNotificationService } = require('../notifications/SmtpNotificationService');

    repos = {
      users: new PrismaUserRepository(),
      facilities: new PrismaFacilityRepository(),
      vehicles: new PrismaVehicleRepository(),
      posts: new PrismaPostRepository(),
      matches: new PrismaMatchRepository(),
      rideLogs: new PrismaRideLogRepository(),
    };
    notifications = new SmtpNotificationService();
  }

  const services: Container['services'] = {
    posts: new PostService(repos.posts, repos.vehicles, notifications),
    matches: new MatchService(repos.matches, repos.posts, repos.users, notifications),
    vehicles: new VehicleService(repos.vehicles),
    users: new UserService(repos.users),
    facilities: new FacilityService(repos.facilities),
  };

  return { repos, services, notifications };
}
