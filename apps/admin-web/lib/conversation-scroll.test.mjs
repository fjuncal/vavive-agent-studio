import assert from "node:assert/strict";
import test from "node:test";
import { nextConversationPage, shouldLoadNextConversationPage } from "./conversation-scroll.ts";

test("does not request another page while the list is far from the bottom", () => {
  assert.equal(shouldLoadNextConversationPage({ scrollHeight: 2400, scrollTop: 300, clientHeight: 600 }), false);
});

test("requests another page when the list reaches the loading threshold", () => {
  assert.equal(shouldLoadNextConversationPage({ scrollHeight: 2400, scrollTop: 1640, clientHeight: 600 }), true);
});

test("requests another page at the exact bottom", () => {
  assert.equal(shouldLoadNextConversationPage({ scrollHeight: 2400, scrollTop: 1800, clientHeight: 600 }), true);
});

test("advances conversation pages sequentially", () => {
  assert.equal(nextConversationPage(1), 2);
  assert.equal(nextConversationPage(2), 3);
});
