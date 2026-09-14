import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  isAdminPasswordValid,
  isExactFranchiseName,
  normalizeAdministrativeEmail,
  passwordsMatch,
} from "./admin-access.ts";

test("admin password policy requires length, a letter and a number", () => {
  assert.equal(isAdminPasswordValid("Abc1234"), false);
  assert.equal(isAdminPasswordValid("abcdefgh"), false);
  assert.equal(isAdminPasswordValid("12345678"), false);
  assert.equal(isAdminPasswordValid(`Senha${"1".repeat(ADMIN_PASSWORD_MIN_LENGTH - 5)}`), true);
});

test("password confirmation accepts only an exact non-empty match", () => {
  assert.equal(passwordsMatch("NovaSenha123", "NovaSenha123"), true);
  assert.equal(passwordsMatch("NovaSenha123", "novasenha123"), false);
  assert.equal(passwordsMatch("", ""), false);
});

test("franchise deactivation requires the exact franchise name", () => {
  assert.equal(isExactFranchiseName("Vavive Niterói", "Vavive Niterói"), true);
  assert.equal(isExactFranchiseName("vavive niterói", "Vavive Niterói"), false);
  assert.equal(isExactFranchiseName("Vavive Niterói ", "Vavive Niterói"), false);
});

test("administrative email normalization trims and lowercases", () => {
  assert.equal(normalizeAdministrativeEmail("  JOAO@EMPRESA.COM "), "joao@empresa.com");
});
