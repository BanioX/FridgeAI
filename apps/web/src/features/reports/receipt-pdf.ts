import { formatSwissDate, type LocalDate } from '@fridgeai/core';
import type { jsPDF } from 'jspdf';
import { messages } from '../../app/messages.de-CH';
import {
  barcode,
  card,
  dashed,
  double,
  FOOTER,
  footers,
  ground,
  PAGE,
  PDF_COLOR as C,
  receiptPaper,
  roundedPicture,
  TOP,
  write,
  type PdfPictures,
  type Rgb,
  type TextStyle,
} from './pdf-kit';
import type { ReceiptPost, ReceiptSpec } from './receipt-spec';

const t = messages.reports.pdf;
const WIDTH = 98;
const X = (PAGE.width - WIDTH) / 2;
const LEFT = X + 9;
const RIGHT = X + WIDTH - 9;
const CENTER = PAGE.width / 2;
/** The longest piece of paper that fits between the top and the footer. */
const MAX_PAPER = FOOTER - 8 - TOP;

const mono = (size: number, color: Rgb = C.ink, bold = false): TextStyle => ({
  size,
  color,
  bold,
  font: 'courier',
});
const tint = (post: ReceiptPost): Rgb =>
  post.tint === 'saved' ? C.smaragd : post.tint === 'lost' ? C.today : C.ink;

/** A piece of the receipt with its height; `draw` paints it from the top `y`. */
interface Block {
  height: number;
  draw: (doc: jsPDF, y: number) => void;
}

/**
 * A short report as a till receipt (ADR-0030): torn paper on the silver ground, the logo and
 * the claim, the title, the posts in Courier, the totals between double rules, a decorative
 * barcode and a thank-you. One receipt fits on a page and stands in its middle; a long list
 * continues on further pieces of paper, so nothing is ever cut off.
 */
export async function receiptPdf(
  spec: ReceiptSpec,
  options: { household: string; detail: string; createdOn: LocalDate; pictures?: PdfPictures },
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Rettich – ${spec.title}`,
    subject: options.detail,
    creator: 'Rettich',
  });

  const head = header(spec, options, options.pictures ?? {});
  const body: Block[] = [];
  spec.sections.forEach((section, index) => {
    if (index > 0) {
      body.push(rule('dashed'));
    }
    body.push(...section.map(postBlock));
  });
  if (spec.empty !== undefined) {
    body.push({
      height: 10,
      draw: (d, y) => {
        write(d, spec.empty ?? '', CENTER, y + 6, { ...mono(9.5, C.muted), align: 'center' });
      },
    });
  }
  const tail = [totals(spec.totals), foot(options)];
  const continued: Block = {
    height: 14,
    draw: (d, y) => {
      write(d, t.receipt.continued, CENTER, y + 9, { ...mono(9, C.muted), align: 'center' });
    },
  };
  const tornEnd = 8;

  // Fill pages: the header starts the first, the totals and the foot close the last.
  const pages: Block[][] = [[head]];
  const heightOf = (blocks: Block[]) => blocks.reduce((sum, block) => sum + block.height, 0);
  for (const block of body) {
    const page = pages.at(-1) ?? [];
    if (heightOf(page) + block.height + tornEnd > MAX_PAPER) {
      pages.push([continued, block]);
    } else {
      page.push(block);
    }
  }
  const last = pages.at(-1) ?? [];
  if (heightOf(last) + heightOf(tail) > MAX_PAPER) {
    pages.push([continued, ...tail]);
  } else {
    last.push(...tail);
  }

  pages.forEach((blocks, index) => {
    if (index > 0) {
      doc.addPage();
    }
    ground(doc);
    const end = index === pages.length - 1 ? 0 : tornEnd;
    const height = heightOf(blocks) + end;
    const top = pages.length === 1 ? Math.max(TOP, (FOOTER - height) / 2) : TOP;
    receiptPaper(doc, { x: X, y: top, width: WIDTH, height });
    let y = top;
    for (const block of blocks) {
      block.draw(doc, y);
      y += block.height;
    }
  });

  footers(doc);
  return doc.output('blob');
}

function header(
  spec: ReceiptSpec,
  options: { household: string; detail: string; createdOn: LocalDate },
  pictures: PdfPictures,
): Block {
  const logo = 15;
  const meta = [options.household, options.detail, t.created(formatSwissDate(options.createdOn))];
  return {
    height: 12 + logo + 8 + 5.5 + 7 + 7 + 6 + meta.length * 4.4 + 2.6 + 8,
    draw: (doc, top) => {
      let y = top + 12;
      if (pictures.logo === undefined) {
        card(doc, { x: CENTER - logo / 2, y, width: logo, height: logo }, C.smaragd, 3.8);
      } else {
        roundedPicture(doc, pictures.logo, { x: CENTER - logo / 2, y, size: logo }, 3.8);
      }
      y += logo + 8;
      write(doc, 'Rettich', CENTER, y, { size: 19, color: C.onyx, bold: true, align: 'center' });
      y += 5.5;
      write(doc, t.receipt.claim, CENTER, y, { ...mono(8.5, C.muted), align: 'center' });
      y += 7;
      dashed(doc, LEFT, RIGHT, y);
      y += 7;
      write(
        doc,
        spec.title,
        CENTER,
        y,
        { ...mono(9.5, C.ink, true), align: 'center' },
        RIGHT - LEFT,
      );
      y += 6;
      for (const line of meta) {
        write(doc, line, CENTER, y, { ...mono(8.5, C.muted), align: 'center' }, RIGHT - LEFT);
        y += 4.4;
      }
      y += 2.6;
      dashed(doc, LEFT, RIGHT, y);
    },
  };
}

function postBlock(post: ReceiptPost): Block {
  return {
    height: post.note === undefined ? 6.2 : 10.6,
    draw: (doc, y) => {
      const style = mono(10, tint(post), post.bold === true);
      write(doc, post.value, RIGHT, y + 4, { ...style, align: 'right' });
      const valueWidth = doc.getTextWidth(post.value);
      write(doc, post.label, LEFT, y + 4, style, RIGHT - LEFT - valueWidth - 4);
      if (post.note !== undefined) {
        write(doc, `  ${post.note}`, LEFT, y + 8.6, mono(8.5, C.muted), RIGHT - LEFT);
      }
    },
  };
}

function rule(kind: 'dashed' | 'double'): Block {
  return {
    height: 9,
    draw: (doc, y) => {
      (kind === 'dashed' ? dashed : double)(doc, LEFT, RIGHT, y + 2);
    },
  };
}

function totals(posts: readonly ReceiptPost[]): Block {
  const lineHeight = (post: ReceiptPost) => (post.big === true ? 9 : 7);
  const height = 6 + posts.reduce((sum, post) => sum + lineHeight(post), 0) + 6;
  return {
    height,
    draw: (doc, top) => {
      double(doc, LEFT, RIGHT, top + 1);
      let y = top + 6;
      for (const post of posts) {
        const size = post.big === true ? 12.5 : 10.5;
        y += lineHeight(post);
        const style = { ...mono(size, tint(post), true) };
        write(doc, post.value, RIGHT, y, { ...style, align: 'right' });
        write(doc, post.label, LEFT, y, style, RIGHT - LEFT - doc.getTextWidth(post.value) - 4);
      }
      double(doc, LEFT, RIGHT, y + 4);
    },
  };
}

function foot(options: { household: string; detail: string; createdOn: LocalDate }): Block {
  return {
    height: 44,
    draw: (doc, y) => {
      barcode(
        doc,
        { x: CENTER - 30, y: y + 10, width: 60, height: 11 },
        `${options.household}|${options.detail}|${options.createdOn}`,
      );
      write(doc, t.receipt.thanks, CENTER, y + 28, { ...mono(9, C.ink), align: 'center' });
    },
  };
}
