/**
 * FilterPanel Component
 * 
 * Provides filter controls for age ranges, skills, and price (free-only).
 * Displays the count of matching bundles and includes a "Clear All" button.
 * Implements responsive layout with collapsible behavior on mobile.
 * 
 * Requirements: 2.1, 3.1, 4.1, 10.4
 */

import { useState } from 'react';
import type { AgeRange, Skill } from '../types/bundle';
import { useFilters } from '../contexts/FilterContext';
import styles from './FilterPanel.module.css';

/**
 * All available age ranges
 */
const AGE_RANGES: AgeRange[] = ['2-3', '3-4', '4-5', '5-6'];

/**
 * All available skills
 */
const SKILLS: Skill[] = ['Alphabet', 'Numbers', 'Shapes/Colors', 'Tracing', 'Logical Thinking'];

/**
 * FilterPanel component
 * 
 * Features:
 * - Age range filter with checkboxes (Requirement 2.1)
 * - Skill filter with checkboxes (Requirement 3.1)
 * - Free-only price filter toggle (Requirement 4.1)
 * - Display count of matching bundles (Requirement 10.4)
 * - "Clear All" button to reset filters (Requirement 3.5)
 * - Collapsible on mobile for better UX (Requirement 7.1)
 */
export function FilterPanel() {
  const { filters, setFilters, resetFilters, filteredBundles } = useFilters();
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Toggle age range filter
   */
  const toggleAgeRange = (ageRange: AgeRange) => {
    const newAgeRanges = filters.ageRanges.includes(ageRange)
      ? filters.ageRanges.filter(ar => ar !== ageRange)
      : [...filters.ageRanges, ageRange];
    
    setFilters({ ...filters, ageRanges: newAgeRanges });
  };

  /**
   * Toggle skill filter
   */
  const toggleSkill = (skill: Skill) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    
    setFilters({ ...filters, skills: newSkills });
  };

  /**
   * Toggle free-only filter
   */
  const toggleFreeOnly = () => {
    setFilters({ ...filters, showFreeOnly: !filters.showFreeOnly });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = 
    filters.ageRanges.length > 0 || 
    filters.skills.length > 0 || 
    filters.showFreeOnly;

  /**
   * Handle clear all filters
   */
  const handleClearAll = () => {
    resetFilters();
  };

  /**
   * Toggle mobile expansion
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside className={styles.filterPanel} aria-label="Filter bundles">
      {/* Mobile toggle button */}
      <button
        className={styles.mobileToggle}
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="filter-content"
        aria-label="Toggle filters"
      >
        <span className={styles.toggleText}>
          Filters {hasActiveFilters && `(${filters.ageRanges.length + filters.skills.length + (filters.showFreeOnly ? 1 : 0)})`}
        </span>
        <span className={styles.toggleIcon} aria-hidden="true">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Filter content - collapsible on mobile */}
      <div
        id="filter-content"
        className={`${styles.filterContent} ${isExpanded ? styles.expanded : ''}`}
      >
        {/* Bundle count and clear button */}
        <div className={styles.header}>
          <div 
            className={styles.count} 
            role="status"
            aria-live="polite" 
            aria-atomic="true"
          >
            <strong>{filteredBundles.length}</strong> {filteredBundles.length === 1 ? 'bundle' : 'bundles'} found
          </div>
          {hasActiveFilters && (
            <button
              className={styles.clearButton}
              onClick={handleClearAll}
              aria-label="Clear all filters"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Age Range Filter */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Age Range</h3>
          <div className={styles.filterOptions} role="group" aria-label="Age range filters">
            {AGE_RANGES.map(ageRange => (
              <label key={ageRange} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={filters.ageRanges.includes(ageRange)}
                  onChange={() => toggleAgeRange(ageRange)}
                  aria-label={`Age ${ageRange} years`}
                />
                <span className={styles.checkboxText}>{ageRange} years</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skill Filter */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Skills</h3>
          <div className={styles.filterOptions} role="group" aria-label="Skill filters">
            {SKILLS.map(skill => (
              <label key={skill} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={filters.skills.includes(skill)}
                  onChange={() => toggleSkill(skill)}
                  aria-label={skill}
                />
                <span className={styles.checkboxText}>{skill}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Price</h3>
          <div className={styles.filterOptions} role="group" aria-label="Price filters">
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={filters.showFreeOnly}
                onChange={toggleFreeOnly}
                aria-label="Show free bundles only"
              />
              <span className={styles.checkboxText}>Free only</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
