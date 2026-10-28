import React from 'react';
import GarmentFlats from './GarmentFlats.jsx';
import { renderProgram } from '../technical/drawingProgram.js';

export default function TechnicalDrawing({ snapshot, view = 'Fronte', selected, onSelect, color = '#e9e4db', exportMode = false, baseOnly = false }) {
  const artwork = !baseOnly && snapshot.artwork?.[view];
  if (artwork) return <img className="dw-technical-vector dw-vector-preview" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artwork.svg)}`} alt={`Tavola vettoriale manuale · ${view}`} />;
  if (snapshot.programs?.[view]) return <div className="dw-program-drawing" dangerouslySetInnerHTML={{ __html: renderProgram(snapshot.programs[view]) }} />;
  return <GarmentFlats snapshot={snapshot} view={view} selected={selected} onSelect={onSelect} color={color} exportMode={exportMode} />;
}
