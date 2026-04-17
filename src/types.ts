export type ElementType = 
  | 'text-box' 
  | 'example-single' 
  | 'example-multi' 
  | 'table' 
  | 'list' 
  | 'sticker' 
  | 'vignette' 
  | 'note';

export interface GrammarElement {
  id: string;
  type: ElementType;
  content: any;
}

export interface GrammarPage {
  id?: string;
  title: string;
  description: string;
  layout: 'single' | 'double';
  elements: GrammarElement[];
  authorId: string;
  authorName: string;
  isPublic: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface VignetteData {
  speaker1: string;
  text1: string;
  speaker2: string;
  text2: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  items: string[];
  style: 'bullet' | 'number';
}
