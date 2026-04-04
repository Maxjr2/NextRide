/**
 * Test helpers: build a fresh in-memory container and supertest app per test.
 */
import {
  MockStore,
  MockUserRepository,
  MockFacilityRepository,
  MockVehicleRepository,
  MockPostRepository,
  MockMatchRepository,
  MockRideLogRepository,
} from '../repositories/mock/MockRepositories';
import { MockNotificationService } from '../notifications/MockNotificationService';
import { PostService } from '../services/PostService';
import { MatchService } from '../services/MatchService';
import { VehicleService } from '../services/VehicleService';
import { UserService } from '../services/UserService';
import { FacilityService } from '../services/FacilityService';
import { createApp } from '../app';
import type { Container } from '../config/container';
import type { WsEmitter } from '../websocket';

/** No-op WS emitter for tests */
const noopWs: WsEmitter = { emit: () => {}, wss: {} as any };

export function buildTestContainer(): { container: Container; store: MockStore } {
  const store = new MockStore();
  const repos: Container['repos'] = {
    users: new MockUserRepository(store),
    facilities: new MockFacilityRepository(store),
    vehicles: new MockVehicleRepository(store),
    posts: new MockPostRepository(store),
    matches: new MockMatchRepository(store),
    rideLogs: new MockRideLogRepository(store),
  };
  const notifications = new MockNotificationService();
  const services: Container['services'] = {
    posts: new PostService(repos.posts, repos.vehicles, notifications),
    matches: new MatchService(repos.matches, repos.posts, repos.users, notifications),
    vehicles: new VehicleService(repos.vehicles),
    users: new UserService(repos.users),
    facilities: new FacilityService(repos.facilities),
  };
  return { container: { repos, services, notifications }, store };
}

export function buildTestApp() {
  const { container, store } = buildTestContainer();
  const app = createApp(container, noopWs);
  return { app, store, container };
}

/** Bearer token format used by mock auth middleware */
export const tokens = {
  pilot: 'pilot-001',
  rider: 'rider-001',
  facility: 'facility-001',
  coordinator: 'coord-001',
};