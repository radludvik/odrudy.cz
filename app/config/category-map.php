<?php

/**
 * Mapování kategorií WP → nový web
 *
 * Klíč = WP post slug (post_name)
 * Hodnoty:
 *   slug         — nový (čistý) slug v URL
 *   name         — zobrazené jméno
 *   name_plural  — genitiv pro statistiky ("12 odrůd jablek")
 *   strip_prefix — co odstranit ze slugu odrůdy ("odruda-jablka-")
 *   visible      — ukázat v menu / na webu (false pro prázdné)
 *   sort_order   — pořadí v navigaci
 */
return [

    // ─── Zelenina ───────────────────────────────────────
    'odrudy-rajcat'    => ['slug' => 'rajcata',  'name' => 'Rajčata',  'name_plural' => 'rajčat',   'strip_prefix' => 'odruda-rajcat-', 'visible' => true, 'sort_order' => 10],
    'odrudy-okurek-pruvodce-pro-uspesnou-sklizen' => ['slug' => 'okurky', 'name' => 'Okurky', 'name_plural' => 'okurek', 'strip_prefix' => 'odruda-okurek-', 'visible' => true, 'sort_order' => 11],
    'odrudy-paprik'    => ['slug' => 'papriky',  'name' => 'Papriky',  'name_plural' => 'paprik',   'strip_prefix' => 'odruda-papriky-', 'visible' => false, 'sort_order' => 12],
    'odrudy-cuket'     => ['slug' => 'cukety',   'name' => 'Cukety',   'name_plural' => 'cuket',    'strip_prefix' => 'odruda-cuket-', 'visible' => false, 'sort_order' => 13],
    'odrudy-dyni'      => ['slug' => 'dyne',     'name' => 'Dýně',     'name_plural' => 'dýní',     'strip_prefix' => 'odruda-dyne-', 'visible' => true, 'sort_order' => 14],
    'odrudy-fazoli'    => ['slug' => 'fazole',   'name' => 'Fazole',   'name_plural' => 'fazolí',   'strip_prefix' => 'odruda-fazoli-', 'visible' => true, 'sort_order' => 15],
    'odrudy-hrasku'    => ['slug' => 'hrasek',   'name' => 'Hrášek',   'name_plural' => 'hrášku',   'strip_prefix' => 'odruda-hrasku-', 'visible' => true, 'sort_order' => 16],
    'odrudy-cibule'    => ['slug' => 'cibule',   'name' => 'Cibule',   'name_plural' => 'cibule',   'strip_prefix' => 'odruda-cibule-', 'visible' => true, 'sort_order' => 17],
    'odrudy-cesneku'   => ['slug' => 'cesnek',   'name' => 'Česnek',   'name_plural' => 'česneku',  'strip_prefix' => 'odruda-cesneku-', 'visible' => false, 'sort_order' => 18],
    'odrudy-brambor'   => ['slug' => 'brambory', 'name' => 'Brambory', 'name_plural' => 'brambor',  'strip_prefix' => 'odruda-brambor-', 'visible' => false, 'sort_order' => 19],
    'odrudy-hlavkoveho-salatu' => ['slug' => 'hlavkovy-salat', 'name' => 'Hlávkový salát', 'name_plural' => 'hlávkového salátu', 'strip_prefix' => 'odruda-hlavkoveho-salatu-', 'visible' => true, 'sort_order' => 20],
    'odrudy-chilli-papricek' => ['slug' => 'chilli', 'name' => 'Chilli papričky', 'name_plural' => 'chilli papriček', 'strip_prefix' => 'odruda-chilli-papricek-', 'visible' => false, 'sort_order' => 21],

    // ─── Ovoce ──────────────────────────────────────────
    'odrudy-jablek'    => ['slug' => 'jablka',   'name' => 'Jablka',   'name_plural' => 'jablek',   'strip_prefix' => 'odruda-jablka-', 'visible' => true, 'sort_order' => 30],
    'odrudy-hrusek'    => ['slug' => 'hrusky',   'name' => 'Hrušky',   'name_plural' => 'hrušek',   'strip_prefix' => 'odruda-hrusky-', 'visible' => true, 'sort_order' => 31],
    'odrudy-svestek'   => ['slug' => 'svestky',  'name' => 'Švestky',  'name_plural' => 'švestek',  'strip_prefix' => 'odruda-svestky-', 'visible' => true, 'sort_order' => 32],
    'odrudy-tresni'    => ['slug' => 'tresne',   'name' => 'Třešně',   'name_plural' => 'třešní',   'strip_prefix' => 'odruda-tresni-', 'visible' => false, 'sort_order' => 33],
    'odrudy-visni'     => ['slug' => 'visne',    'name' => 'Višně',    'name_plural' => 'višní',    'strip_prefix' => 'odruda-visni-', 'visible' => true, 'sort_order' => 34],
    'odrudy-broskvi'   => ['slug' => 'broskve',  'name' => 'Broskve',  'name_plural' => 'broskví',  'strip_prefix' => 'odruda-broskve-', 'visible' => true, 'sort_order' => 35],
    'odrudy-merunek'   => ['slug' => 'merunky',  'name' => 'Meruňky',  'name_plural' => 'meruněk',  'strip_prefix' => 'odruda-merunek-', 'visible' => true, 'sort_order' => 36],

    // ─── Drobné ovoce ───────────────────────────────────
    'odrudy-jahod'     => ['slug' => 'jahody',   'name' => 'Jahody',   'name_plural' => 'jahod',    'strip_prefix' => 'odruda-jahod-', 'visible' => true, 'sort_order' => 40],
    'odrudy-malin'     => ['slug' => 'maliny',   'name' => 'Maliny',   'name_plural' => 'malin',    'strip_prefix' => 'odruda-malin-', 'visible' => true, 'sort_order' => 41],
    'odrudy-boruvek'   => ['slug' => 'boruvky',  'name' => 'Borůvky',  'name_plural' => 'borůvek',  'strip_prefix' => 'odruda-boruvek-', 'visible' => false, 'sort_order' => 42],
    'odrudy-angrestu'  => ['slug' => 'angrest',  'name' => 'Angrešt',  'name_plural' => 'angreštu', 'strip_prefix' => 'odruda-angrestu-', 'visible' => true, 'sort_order' => 43],
    'odrudy-aronie'    => ['slug' => 'aronie',   'name' => 'Aronie',   'name_plural' => 'aronie',   'strip_prefix' => 'odruda-aronie-', 'visible' => true, 'sort_order' => 44],
    'odrudy-zimolezu-na-zahradu-proc-stoji-za-to-ho-pestovat' => ['slug' => 'zimolez', 'name' => 'Zimolez', 'name_plural' => 'zimolezu', 'strip_prefix' => 'odruda-zimolezu-', 'visible' => true, 'sort_order' => 45],
    'odrudy-drinu'     => ['slug' => 'drin',     'name' => 'Dřín',     'name_plural' => 'dřínu',    'strip_prefix' => 'odruda-drinu-', 'visible' => true, 'sort_order' => 46],
    'nejlepsi-odrudy-muchovniku-prehled-vlastnosti-a-pestebni-tipy' => ['slug' => 'muchovnik', 'name' => 'Muchovník', 'name_plural' => 'muchovníku', 'strip_prefix' => 'odruda-muchovniku-', 'visible' => false, 'sort_order' => 47],
    'odrudy-hlosin'    => ['slug' => 'hlosiny',  'name' => 'Hlošiny',  'name_plural' => 'hlošin',   'strip_prefix' => 'odruda-hlosin-', 'visible' => false, 'sort_order' => 48],

    // ─── Víno ───────────────────────────────────────────
    'odrudy-vin'       => ['slug' => 'vina',     'name' => 'Vína',     'name_plural' => 'vín',      'strip_prefix' => 'odruda-vina-', 'visible' => true, 'sort_order' => 50],

    // ─── Okrasné rostliny ───────────────────────────────
    'odrudy-okrasnych-travin' => ['slug' => 'okrasne-traviny', 'name' => 'Okrasné traviny', 'name_plural' => 'okrasných travin', 'strip_prefix' => 'odruda-okrasnych-travin-', 'visible' => true, 'sort_order' => 60],
    'odrudy-hortenzii' => ['slug' => 'hortenzie','name' => 'Hortenzie','name_plural' => 'hortenzií','strip_prefix' => 'odruda-hortenzii-', 'visible' => true, 'sort_order' => 61],
    'odrudy-rododendronu' => ['slug' => 'rododendrony', 'name' => 'Rododendrony', 'name_plural' => 'rododendronů', 'strip_prefix' => 'odruda-rododendronu-', 'visible' => true, 'sort_order' => 62],
    'odrudy-javoru'    => ['slug' => 'javory',   'name' => 'Javory',   'name_plural' => 'javorů',   'strip_prefix' => 'odruda-javoru-', 'visible' => true, 'sort_order' => 63],

    // ─── Plevele (extra obsahová sekce) ─────────────────
    'druhy-a-odrudy-plevele' => ['slug' => 'plevele', 'name' => 'Plevele', 'name_plural' => 'plevele', 'strip_prefix' => 'plevel-', 'visible' => true, 'sort_order' => 90],
];
