import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create();
  await instance.stop();
} 