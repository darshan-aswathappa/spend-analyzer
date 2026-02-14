import amqplib from 'amqplib';
import { env } from './env';

const QUEUE_NAME = 'pdf_processing';
let connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
let channel: Awaited<ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>> | null = null;

export async function getRabbitChannel() {
  if (channel) return channel;
  connection = await amqplib.connect(env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  return channel;
}

export function getQueueName(): string {
  return QUEUE_NAME;
}

export async function closeRabbitConnection(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}
