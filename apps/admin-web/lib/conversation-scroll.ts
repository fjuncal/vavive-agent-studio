export type ScrollMetrics = {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
};

export function shouldLoadNextConversationPage(metrics: ScrollMetrics, threshold = 160) {
  const distanceToBottom = metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight;
  return distanceToBottom <= threshold;
}

export function nextConversationPage(currentPage: number) {
  return Math.max(0, Math.floor(currentPage)) + 1;
}
