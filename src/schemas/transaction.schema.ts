import { TransactionType } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

const isValidObjectId = (id: string): boolean => ObjectId.isValid(id);

export const createTransactionSchema = z.object({
  description: z.string().min(3, 'Mandatory description!'),
  amount: z.number().positive('Value must be positive!'),
  date: z.coerce.date({
    errorMap: () => ({ message: 'Invalid date!' }),
  }),
  categoryId: z.string().refine(isValidObjectId, {
    message: 'Invalid category id!',
  }),
  type: z.enum([TransactionType.expense, TransactionType.income], {
    errorMap: () => ({ message: 'Invalid date!' }),
  }),
});

export const getTransactionSchema = z.object({
  //Mês, ano, type e categoryId
  month: z.string().optional(),
  year: z.string().optional(),
  type: z
    .enum([TransactionType.expense, TransactionType.income], {
      errorMap: () => ({ message: 'Invalid date!' }),
    })
    .optional(),
  categoryId: z
    .string()
    .refine(isValidObjectId, {
      message: 'Invalid category id!',
    })
    .optional(),
});

export const getTransactionsSummarySchema = z.object({
  month: z.union([z.string(), z.number()], {
    message: 'The month must be mandatory!',
  }),
  year: z.union([z.string(), z.number()], {
    message: 'The year must be mandatory!',
  }),
});

export const deleteTransactionSchema = z.object({
  id: z.string().refine(isValidObjectId, {
    message: 'Invalid transaction id!',
  }),
});

export type CreateTransactionBody = z.infer<typeof createTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionSchema>;
export type getTransactionsSummaryQuery = z.infer<
  typeof getTransactionsSummarySchema
>;
export type DeleteTransactionParams = z.infer<typeof deleteTransactionSchema>;
