import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { CreateStatementUseCase } from './CreateStatementUseCase';

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer',
}

export class CreateStatementController {
  async execute(request: Request, response: Response) {
    const { id: user_id } = request.user;
    const { amount, description } = request.body;
    const { user_id: receiver_id } = request.params;

    const splittedPath = request.originalUrl.split('/')
    // find the operation type word in the array
    const operationType = splittedPath.find(word =>
      word === 'deposit' || word === 'withdraw' || word === 'transfer'
    )

    const type = operationType as OperationType;

    const createStatement = container.resolve(CreateStatementUseCase);

    const statement = await createStatement.execute({
      user_id,
      type,
      amount,
      description
    }, receiver_id);

    return response.status(201).json(statement);
  }
}
