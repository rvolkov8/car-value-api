import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) =>
        Promise.resolve({
          id,
          email: 'test@email.com',
          password: '123',
        } as User),
      find: (email: string) =>
        Promise.resolve([
          {
            id: 1,
            email,
            password: '123',
          } as User,
        ]),
    };
    fakeAuthService = {
      signin: (email: string, password: string) =>
        Promise.resolve({
          id: 1,
          email,
          password,
        } as User),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
        { provide: APP_INTERCEPTOR, useClass: CurrentUserInterceptor },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll returns a list of users with a given email', async () => {
    const users = await controller.findAll('test@email.com');
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('test@email.com');
  });

  it('findUser returns a single user with given id', async () => {
    const user = await controller.findUser('1');
    expect(user).toBeDefined();
  });

  it('findUser throws an error if a user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  it('signin updates session object and return a user', async () => {
    const session = { userId: 0 };
    const user = await controller.signIn(
      { email: 'test@email.com', password: '123' },
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});
