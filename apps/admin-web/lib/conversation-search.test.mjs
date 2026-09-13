import assert from "node:assert/strict";
import test from "node:test";
import { conversationMatchesSearch } from "./conversation-search.ts";

const conversation = {
  customerName: "João da Silva",
  customerPhone: "+55 (21) 99999-9999"
};

test("matches a customer by a partial, accent-insensitive name", () => {
  assert.equal(conversationMatchesSearch(conversation, "joao silva"), true);
});

test("matches a customer by formatted or unformatted phone", () => {
  assert.equal(conversationMatchesSearch(conversation, "21999999999"), true);
  assert.equal(conversationMatchesSearch(conversation, "(21) 99999-9999"), true);
});

test("does not match unrelated conversations", () => {
  assert.equal(conversationMatchesSearch(conversation, "maria"), false);
});
