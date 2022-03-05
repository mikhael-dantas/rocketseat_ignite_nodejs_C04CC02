import { inject, injectable } from "tsyringe";

import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { ICreateStatementDTO } from "./ICreateStatementDTO";

@injectable()
export class CreateStatementUseCase {
  constructor(
    @inject('UsersRepository')
    private usersRepository: IUsersRepository,

    @inject('StatementsRepository')
    private statementsRepository: IStatementsRepository
  ) {}

  async execute({ user_id, type, amount, description }: ICreateStatementDTO, receiver_id?: string) {
    const user = await this.usersRepository.findById(user_id);

    if(!user) {
      throw new CreateStatementError.UserNotFound();
    }

    if (type !== 'deposit' && type !== 'withdraw' && type !== 'transfer') {
      throw new CreateStatementError.InvalidType();
    }

    if(type === 'withdraw' || type === 'transfer') {
      const { balance } = await this.statementsRepository.getUserBalance({ user_id });

      if (balance < amount) {
        throw new CreateStatementError.InsufficientFunds()
      }
    }

    const statementToCreate = {
      user_id,
      type,
      amount,
      description
    }

    if(type === 'transfer') {
      if (!receiver_id) {
        throw new CreateStatementError.UserNotFound();
      }

      const receiver = await this.usersRepository.findById(receiver_id);
      if(!receiver) {
        throw new CreateStatementError.UserNotFound();
      }
      Object.assign(statementToCreate, { sender_id: user_id });
      statementToCreate.user_id = receiver_id;
    }

    const statementOperation = await this.statementsRepository.create(statementToCreate);

    return statementOperation;
  }
}
