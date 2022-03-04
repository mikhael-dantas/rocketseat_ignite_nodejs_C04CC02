import request from 'supertest'

import { app } from '../app'
import { Connection, createConnection } from "typeorm"

jest.setTimeout(15000)
let connection: Connection;

beforeAll(async () => {
  connection = await createConnection();
  await connection.dropDatabase();
  await connection.runMigrations();
});

afterAll(async () => {
  await connection.dropDatabase();
  await connection.close();
});

describe("[/users]", () => {

  test("Should be able to create a user by sending name, email and password", async () => {
    const response = await request(app).post("/api/v1/users").send({
      name: "John Doe",
      email: "john@gmail.com",
      password: "123456"
    });

    expect(response.status).toBe(201)
  })

  test("Should be able to create a user by sending name, email and password", async () => {
    const response = await request(app).post("/api/v1/users").send({
      email: "john@gmail.com",
      password: "123456"
    });

    const response2 = await request(app).post("/api/v1/users").send({
      name: "John Doe",
      password: "123456"
    });

    const response3 = await request(app).post("/api/v1/users").send({
      name: "John Doe",
      email: "john@gmail.com",
    });

    expect(response.status).toBe(400)
    expect(response2.status).toBe(500)
    expect(response3.status).toBe(400)
  })

})

describe("[/sessions]", () => {

  test("Should be able to authenticate a user by sending email and password", async () => {
    const user = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }

    await request(app).post("/api/v1/users").send(user);

    const response = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.name).toBe(user.name);
  })

  test("Should not be able to authenticate a user by sending email and wrong password", async () => {
    const user = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }

    await request(app).post("/api/v1/users").send(user);

    const response = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: "222222"
    });

    expect(response.status).toBe(401);
  })

})

describe("[/profile]", () => {
  test("Should be able to get a user's profile", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    const response = await request(app).get("/api/v1/profile").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.name).toBe(userToCreate.name);
  })

  test("Should not be able to get a user's profile without token", async () => {
    const response = await request(app).get("/api/v1/profile");

    expect(response.status).toBe(401);
  })
})

describe("[/statements]", () => {
  test("Should be able to create a deposit statement", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    const response = await request(app).post("/api/v1/statements/deposit").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "deposit",
    });

    expect(response.status).toBe(201);
  })

  test("Should not be able to create a deposit statement without token", async () => {
    const response = await request(app).post("/api/v1/statements/deposit").send({
      amount: 100,
      description: "deposit",
    });
    expect(response.status).toBe(401);
  })

  test("Should be able to create a withdraw statement", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    await request(app).post("/api/v1/statements/deposit").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "deposit",
    });

    const response = await request(app).post("/api/v1/statements/withdraw").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "withdraw",
    });

    expect(response.status).toBe(201);
  })

  test("Should not be able to create a withdraw statement without token", async () => {
    const response = await request(app).post("/api/v1/statements/withdraw").send({
      amount: 100,
      description: "withdraw",
    });
    expect(response.status).toBe(401);
  })

  test("Should not be able to create a withdraw statement with insufficient balance", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    await request(app).post("/api/v1/statements/deposit").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "deposit",
    });

    const response = await request(app).post("/api/v1/statements/withdraw").set("Authorization", `Bearer ${token}`).send({
      amount: 200,
      description: "withdraw",
    });

    expect(response.status).toBe(400);
  })

  test("Should be able to get a user's balance", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    await request(app).post("/api/v1/statements/deposit").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "deposit",
    });

    await request(app).post("/api/v1/statements/withdraw").set("Authorization", `Bearer ${token}`).send({
      amount: 50,
      description: "withdraw",
    });

    const response = await request(app).get("/api/v1/statements/balance").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.balance).toBe(50);
  })

  test("Should not be able to get a user's balance without token", async () => {
    const response = await request(app).get("/api/v1/statements/balance");
    expect(response.status).toBe(401);
  })

  test("Should be able to get a user's statements by id", async () => {
    const userToCreate = {
      name: String(Math.random()),
      email: String(Math.random()) + "@gmail.com",
      password: "123456"
    }
    await request(app).post("/api/v1/users").send(userToCreate);
    const sessionResponse = await request(app).post("/api/v1/sessions").send(userToCreate);
    const token = sessionResponse.body.token;

    const statementCreationResponse = await request(app).post("/api/v1/statements/deposit").set("Authorization", `Bearer ${token}`).send({
      amount: 100,
      description: "special deposit",
    });

    const id = statementCreationResponse.body.id;
    if (!id) {throw new Error("Statement id is not defined")};

    const response = await request(app).get(`/api/v1/statements/${id}`).set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(id);
    expect(response.body.description).toBe("special deposit");
  })

  test("Should not be able to get a user's statements by id without token", async () => {
    const response = await request(app).get("/api/v1/statements/123");
    expect(response.status).toBe(401);
  })

})
