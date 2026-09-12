export type UnreadMessageLike = {
  id?: string | null;
  time?: number | null;
  role?: string | null;
  type?: string | null;
  text?: string | null;
};

export function isCustomerMessageRole(role?: string | null) {
  return role?.toUpperCase() === "USER";
}

function unreadMessageIdentity(message: UnreadMessageLike) {
  return message.id || [message.time, message.role, message.type, message.text].join(":");
}

export function countNewCustomerMessages(
  current: UnreadMessageLike[],
  incoming: UnreadMessageLike[]
) {
  const known = new Set(current.map(unreadMessageIdentity));
  return incoming.reduce((count, message) => count
    + (isCustomerMessageRole(message.role) && !known.has(unreadMessageIdentity(message)) ? 1 : 0), 0);
}
