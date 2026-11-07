import { categoryById, type Report } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { CHF_MONEY, type Money } from '../../app/money-format';

const t = messages.reports.insights;

/**
 * «Was auffällt» (ADR-0030): a few plain sentences from the report numbers: how much was saved,
 * what is wasted most and why (with a tip for that reason), what is urgent now and where the most
 * money went. Only what the data supports.
 */
export function reportInsights(report: Report, money: Money = CHF_MONEY): string[] {
  const lines: string[] = [];
  const share = report.impact.savedShare;
  if (share !== null) {
    const percent = Math.round(share * 100);
    lines.push(
      percent >= 80 ? t.strong(percent) : percent >= 50 ? t.okay(percent) : t.low(percent),
    );
  }
  const [top] = report.impact.topWasted;
  if (top !== undefined) {
    const name = categoryById(top.categoryId)?.name.de ?? top.categoryId;
    lines.push(t.topWaste(name, top.count, money.format(top.valueRappen)));
  }
  const [reason] = report.impact.reasons;
  if (reason !== undefined) {
    lines.push(`${t.reason(messages.wasteReasons[reason.reason])} ${t.tips[reason.reason]}`);
  }
  if (report.fridge.urgent.length > 0) {
    lines.push(t.urgent(report.fridge.urgent.length));
  }
  const [shop] = report.shopping.byRetailer;
  if (shop !== undefined) {
    lines.push(t.shop(messages.priceMemory.shops[shop.retailer], money.format(shop.spentRappen)));
  }
  return lines.length === 0 ? [t.nothing] : lines;
}
