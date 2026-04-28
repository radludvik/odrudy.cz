-- Normalizace duplicitních hodnot v origin_country
SET NAMES utf8mb4;

UPDATE varieties SET origin_country = 'ČR'
WHERE origin_country IN ('Česká republika', 'Česko');

UPDATE varieties SET origin_country = 'USA'
WHERE origin_country IN ('Spojené státy', 'Spojené státy americké', 'Severní Amerika - USA');

UPDATE varieties SET origin_country = 'Velká Británie'
WHERE origin_country IN ('Anglie', 'UK', 'Británie', 'Spojené království');

UPDATE varieties SET origin_country = 'Nizozemsko'
WHERE origin_country IN ('Holandsko');

UPDATE varieties SET origin_country = 'SRN'
WHERE origin_country IN ('Spolková republika Německo');

SELECT '=== Po normalizaci ===' AS info;
SELECT origin_country, COUNT(*) AS cnt
FROM varieties
WHERE origin_country IS NOT NULL
GROUP BY origin_country
ORDER BY cnt DESC
LIMIT 15;
