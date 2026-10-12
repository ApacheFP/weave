import React from 'react';
import GarmentFlats from './GarmentFlats.jsx';

export default function TechnicalDrawing({ snapshot, view = 'Fronte', selected, onSelect, color = '#e9e4db', exportMode = false, baseOnly = false }) {
  const artwork = !baseOnly && snapshot.artwork?.[view];
  if (artwork) return <img className="dw-technical-vector dw-vector-preview" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artwork.svg)}`} alt={`Tavola vettoriale manuale · ${view}`} />;
  return <GarmentFlats snapshot={snapshot} view={view} selected={selected} onSelect={onSelect} color={color} exportMode={exportMode} />;
}
