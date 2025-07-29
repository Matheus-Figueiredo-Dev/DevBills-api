import { TransactionType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { FastifyReply, FastifyRequest } from 'fastify';
import prisma from '../../config/prisma';
import type { getTransactionsSummaryQuery } from '../../schemas/transaction.schema';
import type { CategorySummary } from '../../types/category.types';
import type { TransactionSummary } from '../../types/transaction.types';

dayjs.extend(utc);

const getTransactionsSummary = async (
  request: FastifyRequest<{ Querystring: getTransactionsSummaryQuery }>,
  reply: FastifyReply,
): Promise<void> => {
  const userId = request.userId;

  if (!userId) {
    reply.status(401).send({ error: 'Unauthenticated user!' });
    return;
  }

  const { month, year } = request.query;

  if (!month || !year) {
    reply.status(400).send({ error: 'Month and year are mandatory!' });
    return;
  }

  const startDate = dayjs.utc(`${year}-${month}-01`).startOf('month').toDate();
  const endDate = dayjs.utc(startDate).endOf('month').toDate();

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        category: true,
      },
    });

    let totalExpenses = 0;
    let totalIncomes = 0;
    const groupesExpenses = new Map<string, CategorySummary>();

    for (const transaction of transactions) {
      if (transaction.type === TransactionType.expense) {
        const existing = groupesExpenses.get(transaction.categoryId) ?? {
          categoryId: transaction.categoryId,
          categoryName: transaction.category.name,
          categoryColor: transaction.category.color,
          amount: 0,
          percentage: 0,
        };

        existing.amount += transaction.amount;
        groupesExpenses.set(transaction.categoryId, existing);

        totalExpenses += transaction.amount;
      } else {
        totalIncomes += transaction.amount;
      }
    }

    const summary: TransactionSummary = {
      totalExpenses,
      totalIncomes,
      balance: Number((totalIncomes - totalExpenses).toFixed(2)),
      expensesByCategory: Array.from(groupesExpenses.values())
        .map((entry) => ({
          ...entry,
          percentage: Number.parseFloat(
            ((entry.amount / totalExpenses) * 100).toFixed(2),
          ),
        }))
        .sort((a, b) => b.amount - a.amount),
    };
    reply.send(summary);
  } catch (err) {
    request.log.error('Error on get transactions!', err);
    reply.status(500).send({ error: 'Internal server error!' });
  }
};

export default getTransactionsSummary;
