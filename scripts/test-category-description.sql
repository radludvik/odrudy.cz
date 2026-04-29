-- Test: nastav krátký intro text pro Rajčata
SET NAMES utf8mb4;

UPDATE categories
SET description = '<p>Rajčata jsou nejoblíbenější zeleninou českých zahrad. Patří mezi <strong>nejvděčnější druhy</strong> pro pěstování ze semene a nabízí nepřeberné množství odrůd.</p><h2>Co najdete v této kategorii</h2><ul><li>Tyčková rajčata pro sklizeň přes celé léto</li><li>Keříčková rajčata vhodná na balkon</li><li>Cherry rajčata pro saláty</li></ul>'
WHERE slug = 'rajcata';

SELECT slug, LEFT(description, 100) AS popis FROM categories WHERE slug = 'rajcata';
