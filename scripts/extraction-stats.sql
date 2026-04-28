-- Statistika extrakce LLM dat — co se podařilo extrahovat z každé kategorie
SELECT
    c.name AS kategorie,
    COUNT(v.id) AS celkem,
    SUM(v.color IS NOT NULL) AS s_barvou,
    SUM(v.fruit_size IS NOT NULL) AS s_velikosti,
    SUM(v.fruit_weight IS NOT NULL) AS s_hmotnosti,
    SUM(v.taste_profile IS NOT NULL) AS s_chuti,
    SUM(v.ripening_label IS NOT NULL) AS s_zranim,
    SUM(JSON_LENGTH(v.use_cases) > 0) AS s_pouzitim,
    SUM(JSON_LENGTH(v.disease_resistance) > 0) AS s_odolnosti,
    SUM(JSON_LENGTH(v.characteristics) > 0) AS s_vlastnostmi
FROM categories c
LEFT JOIN varieties v ON v.category_id = c.id AND v.status = 'published'
WHERE c.visible = 1
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order;
