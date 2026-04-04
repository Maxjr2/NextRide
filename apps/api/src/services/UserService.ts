import type { User } from '@nextride/shared';
import type { IUserRepository } from '../repositories/interfaces';
import type { UpdateUserInput } from '@nextride/shared';
import { AppError } from '../middleware/AppError';

export class UserService {
  constructor(private users: IUserRepository) {}

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
  }

  async listAll(): Promise<User[]> {
    return this.users.findAll();
  }

  async upsertFromToken(claims: {
    sub: string;
    email: string;
    name?: string;
    preferred_username?: string;
    roles?: string[];
  }): Promise<User> {
    return this.users.upsertFromToken(claims);
  }

  async updateMe(id: string, data: UpdateUserInput): Promise<User> {
    await this.getById(id); // ensure exists
    return this.users.update(id, data);
  }
}
