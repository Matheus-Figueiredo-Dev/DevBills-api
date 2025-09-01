import type { FastifyReply, FastifyRequest } from 'fastify';
import type { GetHistoricalTransactionsQuery } from '../../schemas/transaction.schema';
import dayjs from 'dayjs';
import prisma from '../../config/prisma';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/pt-br';

dayjs.extend(utc);
dayjs.locale('pt-br');

export const getHistoricalTransactions = async (
  request: FastifyRequest<{ Querystring: GetHistoricalTransactionsQuery }>,
  reply: FastifyReply,
): Promise<void> => {
  const userId = request.userId;

  if (!userId) {
    reply.status(401).send({ error: 'Unauthenticated user!' });
    return;
  }

  const { month, year, months = 6 } = request.query;

  const baseDate = new Date(year, month - 1, 1);
  const startDate = dayjs
    .utc(baseDate)
    .subtract(months - 1, 'month')
    .startOf('month')
    .toDate();
  const endDate = dayjs.utc(baseDate).endOf('month').toDate();

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
    });

    const montlyData = Array.from({ length: months }, (_, i) => {
      const date = dayjs.utc(baseDate).subtract(months - 1 - i, 'month');

      return {
        name: date.format('MMM/YYYY'),
        income: 0,
        expense: 0,
      };
    });

    // biome-ignore lint/complexity/noForEach: <explanation>
    transactions.forEach((transaction) => {
      const monthKey = dayjs.utc(transaction.date).format('MMM/YYYY');
      const monthData = montlyData.find((m) => m.name === monthKey);

      if (monthData) {
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else {
          monthData.expense += transaction.amount;
        }
      }
    });

    reply.send({ history: montlyData });
  } catch (error) {}
};
