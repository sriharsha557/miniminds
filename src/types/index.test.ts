import { describe, it, expect } from 'vitest';
import type { Bundle, FilterState, AgeRange, Skill } from './index';

describe('Type Exports', () => {
  it('should export Bundle type from index', () => {
    const bundle: Bundle = {
      id: 'test',
      name: 'Test',
      ageRange: '2-3',
      skills: ['Alphabet'],
      learningGoals: ['Test goal'],
      worksheetCount: 1,
      isFree: true,
      coverImageUrl: '/test.jpg',
      previewImageUrls: [],
      pdfUrl: '/test.pdf',
      pdfSizeBytes: 1000,
      printingTips: []
    };
    
    expect(bundle.id).toBe('test');
  });

  it('should export FilterState type from index', () => {
    const filter: FilterState = {
      ageRanges: [],
      skills: [],
      showFreeOnly: false
    };
    
    expect(filter.showFreeOnly).toBe(false);
  });

  it('should export AgeRange type from index', () => {
    const age: AgeRange = '3-4';
    expect(age).toBe('3-4');
  });

  it('should export Skill type from index', () => {
    const skill: Skill = 'Numbers';
    expect(skill).toBe('Numbers');
  });
});
