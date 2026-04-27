-- ============================================================
-- odrudy.cz — Cleanup SQL
-- Spustit na produkční DB (záloha NUTNÁ před spuštěním!)
-- Prefix tabulek: wp491_
-- Vytvořeno: 2026-04-27
-- ============================================================

-- ============================================================
-- KROK 1: Smazat 147 off-topic draftů (o rodičovství / dětech)
-- Poznámka: mají post_type='page', post_status='draft', prázdný slug
-- ============================================================
DELETE FROM wp491_postmeta
WHERE post_id IN (
    SELECT ID FROM wp491_posts
    WHERE post_type = 'page'
      AND post_status = 'draft'
);

DELETE FROM wp491_posts
WHERE post_type = 'page'
  AND post_status = 'draft';

-- Verify:
-- SELECT COUNT(*) FROM wp491_posts WHERE post_type='page' AND post_status='draft';
-- → 0

-- ============================================================
-- KROK 2: Smazat 1 113 revizí (post_type='revision')
-- ============================================================
DELETE FROM wp491_postmeta
WHERE post_id IN (
    SELECT ID FROM wp491_posts
    WHERE post_type = 'revision'
);

DELETE FROM wp491_posts
WHERE post_type = 'revision';

-- Verify:
-- SELECT COUNT(*) FROM wp491_posts WHERE post_type='revision';
-- → 0

-- ============================================================
-- KROK 3: Skrýt 9 prázdných kategorií odrůd (post_status → 'private')
-- (Zůstanou v DB, ale nebudou viditelné anonymním návštěvníkům)
-- ID-čka: 942, 27, 781, 936, 792, 2246, 985, 789, 814
-- ============================================================
UPDATE wp491_posts
SET post_status = 'private'
WHERE ID IN (942, 27, 781, 936, 792, 2246, 985, 789, 814)
  AND post_type = 'page';

-- Verify:
-- SELECT ID, post_title, post_status FROM wp491_posts WHERE ID IN (942,27,781,936,792,2246,985,789,814);
-- → všechny mají status 'private'

-- ============================================================
-- KROK 4: Přejmenovat/skrýt pozůstatek 'zkusebni-stranka'
-- (ID=2, "Co jsou to odrůdy?" — původní setup page s testovacím slugem)
-- Možnosti: (A) přejmenovat slug, nebo (B) skrýt jako private
-- Tady volíme (B) — skrýt, v novém webu nahradit řádnou "O projektu" stránkou
-- ============================================================
UPDATE wp491_posts
SET post_status = 'private'
WHERE ID = 2;

-- ============================================================
-- KROK 5: Vyčistit osiřelé postmeta (záznamy bez existujícího post_id)
-- ============================================================
DELETE pm FROM wp491_postmeta pm
LEFT JOIN wp491_posts p ON p.ID = pm.post_id
WHERE p.ID IS NULL;

-- ============================================================
-- KROK 6: Optimize tables (uvolní místo po DELETE operacích)
-- ============================================================
OPTIMIZE TABLE wp491_posts;
OPTIMIZE TABLE wp491_postmeta;

-- ============================================================
-- Výsledky po cleanup:
--   Publikované stránky:  ~1 129 (z 1 148, -9 skrytých kategorií -1 zkusebni)
--   Drafty:               0
--   Revize:               0
--   Ušetřené řádky v DB:  ~1 260
-- ============================================================
