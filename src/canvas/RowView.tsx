import { Fragment } from 'react';
import { rowKind, spaceAfter } from '../model/layout';
import type { Row } from '../model/types';
import { InlineWidgetCell, TableCell, TextRowCell } from './cells';

/** One row, rendered as the element the compiler turns it into. */
export function RowView({ row, first }: { row: Row; first: boolean }) {
  switch (rowKind(row)) {
    case 'inline':
      // Like GitHub's <p align>: 16px below, text-align positions the images.
      return (
        <div data-row-id={row.id} className="mb-4" style={{ textAlign: row.align }}>
          {row.cells.map((cell, i) => (
            <Fragment key={cell.id}>
              <InlineWidgetCell cell={cell} row={row} />
              {spaceAfter(row, i) && ' '}
            </Fragment>
          ))}
        </div>
      );
    case 'text':
      return (
        <div data-row-id={row.id}>
          <TextRowCell cell={row.cells[0]} row={row} first={first} />
        </div>
      );
    case 'table':
      return (
        <div data-row-id={row.id}>
          <table align={row.align} style={first ? { marginTop: 0 } : undefined}>
            <tbody>
              <tr>
                {row.cells.map((cell) => (
                  <TableCell key={cell.id} cell={cell} row={row} />
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
  }
}
