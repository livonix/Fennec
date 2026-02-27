import { schemas } from "./validation.js";
import { describe, it, expect } from "@jest/globals";

describe("Validation Schemas", () => {
  describe("auth.createAccount", () => {
    const schema = schemas.auth.createAccount;

    it("should validate a valid request body", () => {
      const body = {
        email: "test@example.com",
        password: "password123",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("should validate a valid request body with captcha", () => {
      const body = {
        email: "test@example.com",
        password: "password123",
        captcha: "some-captcha-token",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("should fail if email is missing", () => {
      const body = {
        password: "password123",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("should fail if password is missing", () => {
      const body = {
        email: "test@example.com",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("should not require username", () => {
      const body = {
        email: "test@example.com",
        password: "password123",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe("auth.register", () => {
    const schema = schemas.auth.register;

    it("should require username", () => {
      const body = {
        email: "test@example.com",
        password: "password123",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(false);
    });

    it("should validate with username", () => {
      const body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };
      const result = schema.body.safeParse(body);
      expect(result.success).toBe(true);
    });
  });
});
