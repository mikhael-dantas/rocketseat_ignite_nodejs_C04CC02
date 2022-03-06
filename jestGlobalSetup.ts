require('ts-node').register('/path/to/tsconfig.json');

import { createConnection } from "typeorm";

function setup() {
  createConnection().then(async connection => {

    await connection.dropDatabase();
    await connection.runMigrations();
    await connection.close();

  });
}

export default setup;
