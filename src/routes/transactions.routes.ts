import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';

import createTransaction from '../controllers/transactions/createTransaction.controller';
import { deleteTransaction } from '../controllers/transactions/deleteTransaction.controller';
import getTransactions from '../controllers/transactions/getTransactions.controller';
import getTransactionsSummary from '../controllers/transactions/getTransactionsSummary.controller';
import {
  createTransactionSchema,
  deleteTransactionSchema,
  getHistoricalTransactionsSchema,
  getTransactionSchema,
  getTransactionsSummarySchema,
} from '../schemas/transaction.schema';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getHistoricalTransactions } from '../controllers/transactions/getHistoricalTransactions.controller';

const transactionsRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.addHook('preHandler', authMiddleware);

  //Criação
  fastify.route({
    method: 'POST',
    url: '/',
    schema: {
      body: zodToJsonSchema(createTransactionSchema),
    },
    handler: createTransaction,
  });

  //Buscar com filtros
  fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: zodToJsonSchema(getTransactionSchema),
    },
    handler: getTransactions,
  });

  //Buscar resumo
  fastify.route({
    method: 'GET',
    url: '/summary',
    schema: {
      querystring: zodToJsonSchema(getTransactionsSummarySchema),
    },
    handler: getTransactionsSummary,
  });

  //Histórico de transações
  fastify.route({
    method: 'GET',
    url: '/historical',
    schema: {
      querystring: zodToJsonSchema(getHistoricalTransactionsSchema),
    },
    handler: getHistoricalTransactions,
  });
  //Deletar transação
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: zodToJsonSchema(deleteTransactionSchema),
    },
    handler: deleteTransaction,
  });
};

export default transactionsRoutes;
