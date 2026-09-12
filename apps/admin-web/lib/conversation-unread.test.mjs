import assert from "node:assert/strict";
import test from "node:test";
import { countNewCustomerMessages, isCustomerMessageRole } from "./conversation-unread.ts";

const message = (id, role) => ({ id, role, time: 1_700_000_000_000, text: id });

test("only customer messages contribute to human unread", () => {
  assert.equal(isCustomerMessageRole("USER"), true);
  assert.equal(isCustomerMessageRole("HUMAN"), false);
  assert.equal(isCustomerMessageRole("ASSISTANT"), false);
  assert.equal(countNewCustomerMessages([], [message("customer-1", "USER"), message("human-1", "HUMAN")]), 1);
});

test("repeated polling state does not increment again", () => {
  const current = [message("customer-1", "USER")];
  const samePage = [message("customer-1", "USER"), message("assistant-1", "ASSISTANT")];
  assert.equal(countNewCustomerMessages(current, samePage), 0);
});

test("multiple new customer messages are counted exactly once", () => {
  const current = [message("customer-1", "USER")];
  const nextPage = [
    message("customer-1", "USER"),
    message("customer-2", "USER"),
    message("customer-3", "USER"),
    message("assistant-2", "ASSISTANT")
  ];
  assert.equal(countNewCustomerMessages(current, nextPage), 2);
});
