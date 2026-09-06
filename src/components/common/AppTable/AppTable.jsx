import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import './AppTable.scss';

export function AppTableContainer({ children, className = '', ...rest }) {
  return (
    <TableContainer
      className={`app-table-container ${className}`.trim()}
      {...rest}
    >
      {children}
    </TableContainer>
  );
}

export function AppTable({ children, className = '', ...rest }) {
  return (
    <Table className={`app-table ${className}`.trim()} {...rest}>
      {children}
    </Table>
  );
}

export function AppTableHead({ children, className = '', ...rest }) {
  return (
    <TableHead className={`app-table-head ${className}`.trim()} {...rest}>
      {children}
    </TableHead>
  );
}

export function AppTableBody({ children, className = '', ...rest }) {
  return (
    <TableBody className={`app-table-body ${className}`.trim()} {...rest}>
      {children}
    </TableBody>
  );
}

export function AppTableRow({ children, className = '', ...rest }) {
  return (
    <TableRow className={`app-table-row ${className}`.trim()} {...rest}>
      {children}
    </TableRow>
  );
}

export function AppTableCell({
  children,
  className = '',
  head = false,
  ...rest
}) {
  return (
    <TableCell
      className={`app-table-cell ${
        head ? 'app-table-cell--head' : ''
      } ${className}`.trim()}
      {...rest}
    >
      {children}
    </TableCell>
  );
}

export function AppTableSortLabel({
  active = false,
  direction = 'asc',
  onClick,
  children,
  className = '',
  ...rest
}) {
  return (
    <TableSortLabel
      active={active}
      direction={direction}
      onClick={onClick}
      className={`app-table-sort-label ${
        active ? 'app-table-sort-label--active' : ''
      } app-table-sort-label--${direction} ${className}`.trim()}
      {...rest}
    >
      {children}
    </TableSortLabel>
  );
}

export function AppTablePagination({ className = '', ...rest }) {
  return (
    <TablePagination
      component="div"
      className={`app-table-pagination ${className}`.trim()}
      {...rest}
    />
  );
}

AppTable.Container = AppTableContainer;
AppTable.Head = AppTableHead;
AppTable.Body = AppTableBody;
AppTable.Row = AppTableRow;
AppTable.Cell = AppTableCell;
AppTable.SortLabel = AppTableSortLabel;
AppTable.Pagination = AppTablePagination;

export default AppTable;
