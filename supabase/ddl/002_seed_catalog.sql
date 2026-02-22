-- Seed/Upsert bundle catalog from current MiniMinds bundle data.
-- Safe to run multiple times.

begin;

insert into public.bundle_catalog (
  id,
  name,
  age_range,
  is_free,
  price,
  worksheet_count,
  cover_image_url,
  pdf_storage_path,
  is_active,
  metadata
)
select
  v.id,
  v.name,
  v.age_range,
  v.is_free,
  v.price,
  v.worksheet_count,
  v.cover_image_url,
  v.pdf_storage_path,
  true as is_active,
  jsonb_build_object(
    'skills', to_jsonb(v.skills),
    'learningGoals', to_jsonb(v.learning_goals),
    'previewImageUrls', to_jsonb(v.preview_image_urls),
    'printingTips', to_jsonb(v.printing_tips),
    'pdfSizeBytes', v.pdf_size_bytes
  ) as metadata
from (
  values
    (
      'mega-bundle-complete-collection',
      'Mega Bundle - Complete Collection',
      '5-6',
      false,
      199.00,
      10000,
      '/images/mega-bundle.jpg',
      '/pdfs/mega-bundle-complete-collection.pdf',
      array['Alphabet','Numbers','Shapes/Colors','Tracing','Logical Thinking']::text[],
      array[
        'Build complete preschool readiness across all core skills',
        'Get progressive worksheets from beginner to advanced levels',
        'Support structured daily and weekly home learning routines'
      ]::text[],
      array['/images/mega-bundle.jpg']::text[],
      array[
        'Print selected worksheets based on your child''s current skill level',
        'Use duplex printing to reduce paper usage for large sets',
        'Organize worksheets by skill and age in labeled folders'
      ]::text[],
      104857600
    ),
    (
      'alphabet-tracing-basics',
      'Alphabet Tracing Basics',
      '3-4',
      true,
      0.00,
      26,
      '/images/alphabet-tracing.jpg',
      '/pdfs/alphabet-tracing-basics.pdf',
      array['Alphabet','Tracing']::text[],
      array[
        'Recognize uppercase letters A-Z',
        'Practice proper letter formation',
        'Develop fine motor control'
      ]::text[],
      array['/images/alphabet-tracing.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Use cardstock for durability',
        'Black and white printing recommended'
      ]::text[],
      2457600
    ),
    (
      'counting-fun-1-10',
      'Counting Fun: Numbers 1-10',
      '2-3',
      true,
      0.00,
      15,
      '/images/counting-fun.jpg',
      '/pdfs/counting-fun-1-10.pdf',
      array['Numbers']::text[],
      array[
        'Count from 1 to 10',
        'Recognize number symbols',
        'Match quantities to numbers'
      ]::text[],
      array['/images/counting-fun.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Color printing enhances engagement',
        'Laminate for reusable counting practice'
      ]::text[],
      1843200
    ),
    (
      'shapes-and-colors-explorer',
      'Shapes & Colors Explorer',
      '2-3',
      false,
      149.00,
      20,
      '/images/counting-fun.jpg',
      '/pdfs/shapes-and-colors-explorer.pdf',
      array['Shapes/Colors']::text[],
      array[
        'Identify basic shapes (circle, square, triangle, rectangle)',
        'Recognize primary colors',
        'Sort objects by shape and color'
      ]::text[],
      array['/images/counting-fun.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Color printing required for full experience',
        'Use thick paper for cutting activities'
      ]::text[],
      3145728
    ),
    (
      'pre-writing-lines-curves',
      'Pre-Writing: Lines & Curves',
      '3-4',
      true,
      0.00,
      18,
      '/images/alphabet-tracing.jpg',
      '/pdfs/pre-writing-lines-curves.pdf',
      array['Tracing']::text[],
      array[
        'Practice drawing straight lines',
        'Master curved line formation',
        'Build pencil grip strength',
        'Prepare for letter writing'
      ]::text[],
      array['/images/alphabet-tracing.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Black and white printing recommended',
        'Use with pencils or crayons for best results'
      ]::text[],
      2097152
    ),
    (
      'pattern-recognition-fun',
      'Pattern Recognition Fun',
      '4-5',
      false,
      199.00,
      22,
      '/images/counting-fun.jpg',
      '/pdfs/pattern-recognition-fun.pdf',
      array['Logical Thinking']::text[],
      array[
        'Identify and continue patterns',
        'Recognize AB, ABC, and AAB patterns',
        'Develop logical reasoning skills',
        'Enhance visual discrimination'
      ]::text[],
      array['/images/counting-fun.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Color printing enhances pattern visibility',
        'Consider laminating for repeated use'
      ]::text[],
      2621440
    ),
    (
      'sight-words-starter-pack',
      'Sight Words Starter Pack',
      '5-6',
      false,
      249.00,
      30,
      '/images/sight-words.jpg',
      '/pdfs/sight-words-starter-pack.pdf',
      array['Alphabet']::text[],
      array[
        'Recognize 25 common sight words',
        'Practice reading simple sentences',
        'Build reading confidence',
        'Improve word recognition speed'
      ]::text[],
      array['/images/sight-words.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Black and white printing recommended',
        'Cut into flashcards for additional practice'
      ]::text[],
      3670016
    ),
    (
      'number-puzzles-advanced',
      'Number Puzzles: Advanced',
      '5-6',
      true,
      0.00,
      25,
      '/images/counting-fun.jpg',
      '/pdfs/number-puzzles-advanced.pdf',
      array['Numbers','Logical Thinking']::text[],
      array[
        'Count to 20 and beyond',
        'Solve simple addition problems',
        'Complete number sequences',
        'Develop problem-solving skills'
      ]::text[],
      array['/images/counting-fun.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Black and white printing recommended',
        'Use with pencils and erasers for problem-solving'
      ]::text[],
      2883584
    ),
    (
      'logic-games-for-preschoolers',
      'Logic Games for Preschoolers',
      '4-5',
      false,
      179.00,
      28,
      '/images/alphabet-tracing.jpg',
      '/pdfs/logic-games-for-preschoolers.pdf',
      array['Logical Thinking']::text[],
      array[
        'Solve age-appropriate puzzles',
        'Practice critical thinking',
        'Develop reasoning abilities',
        'Complete matching and sorting activities'
      ]::text[],
      array['/images/alphabet-tracing.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Color printing enhances visual appeal',
        'Laminate for reusable puzzle practice'
      ]::text[],
      3407872
    ),
    (
      'rainbow-shapes-coloring',
      'Rainbow Shapes Coloring',
      '3-4',
      false,
      129.00,
      16,
      '/images/counting-fun.jpg',
      '/pdfs/rainbow-shapes-coloring.pdf',
      array['Shapes/Colors','Tracing']::text[],
      array[
        'Identify shapes in everyday objects',
        'Practice staying within lines',
        'Learn color names',
        'Develop hand-eye coordination'
      ]::text[],
      array['/images/counting-fun.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Black and white printing for coloring activities',
        'Use crayons or colored pencils'
      ]::text[],
      1572864
    ),
    (
      'early-math-concepts',
      'Early Math Concepts',
      '4-5',
      false,
      169.00,
      24,
      '/images/sight-words.jpg',
      '/pdfs/early-math-concepts.pdf',
      array['Numbers','Shapes/Colors']::text[],
      array[
        'Compare quantities (more, less, equal)',
        'Understand basic measurement concepts',
        'Sort objects by attributes',
        'Recognize number patterns'
      ]::text[],
      array['/images/sight-words.jpg']::text[],
      array[
        'Print on standard letter (8.5x11) or A4 paper',
        'Color printing recommended for visual clarity',
        'Use manipulatives alongside worksheets'
      ]::text[],
      2949120
    )
) as v(
  id,
  name,
  age_range,
  is_free,
  price,
  worksheet_count,
  cover_image_url,
  pdf_storage_path,
  skills,
  learning_goals,
  preview_image_urls,
  printing_tips,
  pdf_size_bytes
)
on conflict (id) do update
set
  name = excluded.name,
  age_range = excluded.age_range,
  is_free = excluded.is_free,
  price = excluded.price,
  worksheet_count = excluded.worksheet_count,
  cover_image_url = excluded.cover_image_url,
  pdf_storage_path = excluded.pdf_storage_path,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

commit;
