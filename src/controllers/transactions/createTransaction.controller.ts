import type { FastifyReply, FastifyRequest } from 'fastify';
import prisma from '../../config/prisma';
import {
  type CreateTransactionBody,
  createTransactionSchema,
} from '../../schemas/transaction.schema';

const createTransaction = async (
  request: FastifyRequest<{ Body: CreateTransactionBody }>,
  reply: FastifyReply,
): Promise<void> => {
  //Necessário primeiro enviar o usuário
  const userId = request.userId;

  if (!userId) {
    reply.status(401).send({ error: 'Unauthenticated user!' });
    return;
  }
  //Necessário enviar validação
  const result = createTransactionSchema.safeParse(request.body);

  if (!result.success) {
    const errorMessage =
      result.error.errors[0].message || 'Invalid validation!';

    reply.status(400).send({ error: errorMessage });
    return;
  }

  const transaction = result.data;

  try {
    const category = await prisma.category.findFirst({
      where: {
        id: transaction.categoryId,
        type: transaction.type,
      },
    });

    if (!category) {
      reply.status(400).send({ error: 'Invalid category!' });
      return;
    }

    const parseDate = new Date(transaction.date);

    const newTransaction = await prisma.transaction.create({
      data: {
        ...transaction,
        userId,
        date: parseDate,
      },
    });

    reply.status(201).send(newTransaction);
  } catch (err) {
    request.log.error('Error creating transaction!', err);
    reply.status(500).send({ error: 'Internal server error!' });
  }
};

export default createTransaction;
