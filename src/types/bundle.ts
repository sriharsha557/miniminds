/**
 * Type definitions for MiniMinds Frontend
 * 
 * These types define the core data models for the application,
 * including bundles, filters, and related types.
 */

/**
 * Age range categories for worksheet bundles
 */
export type AgeRange = '2-3' | '3-4' | '4-5' | '5-6';

/**
 * Learning skill categories
 */
export type Skill = 'Alphabet' | 'Numbers' | 'Shapes/Colors' | 'Tracing' | 'Logical Thinking';

/**
 * A worksheet bundle containing educational content
 * 
 * Requirements: 1.1, 1.2
 */
export interface Bundle {
  /** Unique identifier for the bundle */
  id: string;
  
  /** Display name of the bundle */
  name: string;
  
  /** Target age range for the bundle */
  ageRange: AgeRange;
  
  /** Learning skills covered by this bundle */
  skills: Skill[];
  
  /** Educational objectives that the bundle helps achieve */
  learningGoals: string[];
  
  /** Number of worksheets included in the bundle */
  worksheetCount: number;
  
  /** Whether the bundle is free or requires payment */
  isFree: boolean;
  
  /** Price in dollars (only present if isFree is false) */
  price?: number;
  
  /** URL to the bundle's cover image */
  coverImageUrl: string;
  
  /** URLs to preview images of sample worksheets */
  previewImageUrls: string[];
  
  /** URL to the downloadable PDF file */
  pdfUrl: string;
  
  /** Size of the PDF file in bytes */
  pdfSizeBytes: number;
  
  /** Tips for printing the worksheets */
  printingTips: string[];
}

/**
 * State for filtering bundles
 * 
 * Requirements: 1.1, 1.2
 */
export interface FilterState {
  /** Selected age ranges to filter by (empty array means no filter) */
  ageRanges: AgeRange[];
  
  /** Selected skills to filter by (empty array means no filter) */
  skills: Skill[];
  
  /** Whether to show only free bundles */
  showFreeOnly: boolean;
}
