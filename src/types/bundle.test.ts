import { describe, it, expect } from 'vitest';
import type { Bundle, FilterState, AgeRange, Skill } from './bundle';

describe('Bundle Types', () => {
  describe('AgeRange type', () => {
    it('should accept valid age range values', () => {
      const validAgeRanges: AgeRange[] = ['2-3', '3-4', '4-5', '5-6'];
      expect(validAgeRanges).toHaveLength(4);
    });
  });

  describe('Skill type', () => {
    it('should accept valid skill values', () => {
      const validSkills: Skill[] = [
        'Alphabet',
        'Numbers',
        'Shapes/Colors',
        'Tracing',
        'Logical Thinking'
      ];
      expect(validSkills).toHaveLength(5);
    });
  });

  describe('Bundle interface', () => {
    it('should accept a valid bundle object', () => {
      const bundle: Bundle = {
        id: 'test-bundle-1',
        name: 'Test Bundle',
        ageRange: '3-4',
        skills: ['Alphabet', 'Tracing'],
        learningGoals: ['Learn letters', 'Practice writing'],
        worksheetCount: 10,
        isFree: true,
        coverImageUrl: '/images/test-cover.jpg',
        previewImageUrls: ['/images/preview1.jpg', '/images/preview2.jpg'],
        pdfUrl: '/pdfs/test-bundle.pdf',
        pdfSizeBytes: 1024000,
        printingTips: ['Print on letter size paper', 'Use color printer']
      };

      expect(bundle.id).toBe('test-bundle-1');
      expect(bundle.name).toBe('Test Bundle');
      expect(bundle.ageRange).toBe('3-4');
      expect(bundle.skills).toContain('Alphabet');
      expect(bundle.isFree).toBe(true);
    });

    it('should accept a paid bundle with price', () => {
      const paidBundle: Bundle = {
        id: 'paid-bundle-1',
        name: 'Premium Bundle',
        ageRange: '4-5',
        skills: ['Numbers', 'Logical Thinking'],
        learningGoals: ['Count to 20', 'Solve simple puzzles'],
        worksheetCount: 25,
        isFree: false,
        price: 9.99,
        coverImageUrl: '/images/premium-cover.jpg',
        previewImageUrls: ['/images/preview3.jpg'],
        pdfUrl: '/pdfs/premium-bundle.pdf',
        pdfSizeBytes: 2048000,
        printingTips: ['Best on cardstock']
      };

      expect(paidBundle.isFree).toBe(false);
      expect(paidBundle.price).toBe(9.99);
    });

    it('should accept a bundle with all skills', () => {
      const bundle: Bundle = {
        id: 'comprehensive-bundle',
        name: 'Comprehensive Bundle',
        ageRange: '5-6',
        skills: ['Alphabet', 'Numbers', 'Shapes/Colors', 'Tracing', 'Logical Thinking'],
        learningGoals: ['Master all skills'],
        worksheetCount: 50,
        isFree: false,
        price: 19.99,
        coverImageUrl: '/images/comprehensive-cover.jpg',
        previewImageUrls: [],
        pdfUrl: '/pdfs/comprehensive-bundle.pdf',
        pdfSizeBytes: 5120000,
        printingTips: []
      };

      expect(bundle.skills).toHaveLength(5);
    });
  });

  describe('FilterState interface', () => {
    it('should accept an empty filter state', () => {
      const emptyFilter: FilterState = {
        ageRanges: [],
        skills: [],
        showFreeOnly: false
      };

      expect(emptyFilter.ageRanges).toHaveLength(0);
      expect(emptyFilter.skills).toHaveLength(0);
      expect(emptyFilter.showFreeOnly).toBe(false);
    });

    it('should accept a filter state with age ranges', () => {
      const ageFilter: FilterState = {
        ageRanges: ['2-3', '3-4'],
        skills: [],
        showFreeOnly: false
      };

      expect(ageFilter.ageRanges).toContain('2-3');
      expect(ageFilter.ageRanges).toContain('3-4');
    });

    it('should accept a filter state with skills', () => {
      const skillFilter: FilterState = {
        ageRanges: [],
        skills: ['Alphabet', 'Numbers'],
        showFreeOnly: false
      };

      expect(skillFilter.skills).toContain('Alphabet');
      expect(skillFilter.skills).toContain('Numbers');
    });

    it('should accept a filter state with free only enabled', () => {
      const freeOnlyFilter: FilterState = {
        ageRanges: [],
        skills: [],
        showFreeOnly: true
      };

      expect(freeOnlyFilter.showFreeOnly).toBe(true);
    });

    it('should accept a filter state with all filters active', () => {
      const fullFilter: FilterState = {
        ageRanges: ['3-4', '4-5'],
        skills: ['Tracing', 'Shapes/Colors'],
        showFreeOnly: true
      };

      expect(fullFilter.ageRanges).toHaveLength(2);
      expect(fullFilter.skills).toHaveLength(2);
      expect(fullFilter.showFreeOnly).toBe(true);
    });
  });
});
