import { getRepository, Repository } from "typeorm";

import { Statement } from "../entities/Statement";
import { ICreateStatementDTO } from "../useCases/createStatement/ICreateStatementDTO";
import { IGetBalanceDTO } from "../useCases/getBalance/IGetBalanceDTO";
import { IGetStatementOperationDTO } from "../useCases/getStatementOperation/IGetStatementOperationDTO";
import { IStatementsRepository } from "./IStatementsRepository";

export class StatementsRepository implements IStatementsRepository {
  private repository: Repository<Statement>;

  constructor() {
    this.repository = getRepository(Statement);
  }

  async create({
    user_id,
    sender_id,
    amount,
    description,
    type
  }: ICreateStatementDTO): Promise<Statement> {
    const statementToCreate = {
      user_id,
      amount,
      description,
      type
    }

    if (type === 'transfer') {
      Object.assign(statementToCreate, { sender_id });
    }

    const statement = this.repository.create(statementToCreate);

    return this.repository.save(statement);
  }

  async findStatementOperation({ statement_id, user_id }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.repository.findOne(statement_id, {
      where: { user_id }
    });
  }

  async getUserBalance({ user_id, with_statement = false }: IGetBalanceDTO): Promise<{ balance: number } | { balance: number, statement: Statement[] }> {
    const statement = await this.repository.find({
      where: { user_id },
    });

    const transferStatements = await this.repository.find({
      where: { sender_id: user_id },
    });

    const halfBalance = statement.reduce((acc, operation) => {
      if (operation.type === 'deposit' || operation.type === 'transfer') {
        return Number(acc) + Number(operation.amount);
      } else {
        return Number(acc) - Number(operation.amount);
      }
    }, 0)

    const balance = transferStatements.reduce((acc, operation) => {
      return Number(acc) - Number(operation.amount);
    }, halfBalance)

    if (with_statement) {
      return {
        statement,
        balance
      }
    }

    return { balance }
  }
}
