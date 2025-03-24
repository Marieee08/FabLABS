// src/types/pdf-types.ts
import { jsPDF } from 'jspdf';


// Common interfaces for jsPDF-autotable
export interface AutoTableResult {
  finalY: number;
  pageNumber?: number;
  lastAutoTable?: boolean;
  pageCount?: number;
}


export interface AutoTableStyles {
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
  cellWidth?: number | 'auto' | 'wrap';
  cellPadding?: number;
  font?: string;
  textColor?: string;
  fillColor?: string;
  lineColor?: string;
  lineWidth?: number;
  halign?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  minCellHeight?: number;
  minCellWidth?: number;
}


export interface AutoTableColumnStyles {
  [key: number]: Partial<AutoTableStyles>;
}


export interface AutoTableColumnOption {
  content?: string;
  styles?: Partial<AutoTableStyles>;
}


export interface AutoTableSettings {
  head?: Array<string[] | AutoTableColumnOption[]>;
  body?: Array<string[] | AutoTableColumnOption[]>;
  foot?: Array<string[] | AutoTableColumnOption[]>;
  startY?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  pageBreak?: 'auto' | 'avoid' | 'always';
  rowPageBreak?: 'auto' | 'avoid';
  showHead?: 'everyPage' | 'firstPage' | 'never';
  showFoot?: 'everyPage' | 'lastPage' | 'never';
  theme?: 'striped' | 'grid' | 'plain';
  styles?: Partial<AutoTableStyles>;
  columnStyles?: AutoTableColumnStyles;
  didDrawPage?: (data: any) => void;
  didParseCell?: (data: any) => void;
  willDrawCell?: (data: any) => void;
  didDrawCell?: (data: any) => void;
}


// Extend the jsPDF library type declarations
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: AutoTableSettings): AutoTableResult;
  }
}


// Also provide a standalone function type for jspdf-autotable
declare module 'jspdf-autotable' {
  export default function autoTable(
    doc: jsPDF,
    options: AutoTableSettings
  ): AutoTableResult;
}

