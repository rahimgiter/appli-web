import React from 'react';
import { useParams } from 'react-router-dom';
import TableCrud from './TableCrud';

export default function Setting() {
  const { table } = useParams();

  if (!table) {
    return (
      <div className="container my-4">
        <h3>Paramètres</h3>
        <p className="text-muted">Sélectionne un élément dans la sidebar pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h3>Paramètres: {table}</h3>
      <TableCrud table={table} />
    </div>
  );
}
