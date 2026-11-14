import { useMemo, useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  numeric?: boolean
  render: (row: T) => ReactNode
  sortValue?: (row: T) => number | string
}

interface SortableTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  initialSort: string
  initialDirection?: 'asc' | 'desc'
  caption?: string
  selectedKey?: string
  onRowSelect?: (row: T) => void
  footer?: ReactNode
}

export function SortableTable<T>({
  columns,
  rows,
  rowKey,
  initialSort,
  initialDirection = 'desc',
  caption,
  selectedKey,
  onRowSelect,
  footer,
}: SortableTableProps<T>) {
  const [sort, setSort] = useState({ key: initialSort, direction: initialDirection })

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key) ?? columns[0]
    const value = (row: T) => {
      const raw = column.sortValue ? column.sortValue(row) : (row as Record<string, unknown>)[column.key]
      return typeof raw === 'number' ? raw : String(raw ?? '')
    }
    return [...rows].sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      const order = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sort.direction === 'asc' ? order : -order
    })
  }, [rows, sort, columns])

  const toggle = (key: string) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    )

  return (
    <div className="table-wrap">
      <table className="data">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={column.numeric ? 'num' : undefined}
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" onClick={() => toggle(column.key)}>
                    {column.label}
                    <span className="sort-glyph" aria-hidden="true">
                      {active ? (sort.direction === 'asc' ? '\u2191' : '\u2193') : ''}
                    </span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row)
            return (
              <tr
                key={key}
                aria-selected={selectedKey === key ? true : undefined}
                onClick={onRowSelect ? () => onRowSelect(row) : undefined}
                style={onRowSelect ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.numeric ? 'num' : undefined}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
      {footer}
    </div>
  )
}
