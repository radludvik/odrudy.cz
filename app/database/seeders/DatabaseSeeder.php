<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Kategorie
        $categories = [
            ['slug'=>'rajcata',   'name'=>'Rajčata',   'name_plural'=>'Rajčat',   'sort_order'=>1, 'visible'=>true],
            ['slug'=>'okurky',    'name'=>'Okurky',    'name_plural'=>'Okurek',   'sort_order'=>2, 'visible'=>true],
            ['slug'=>'papriky',   'name'=>'Papriky',   'name_plural'=>'Paprik',   'sort_order'=>3, 'visible'=>true],
            ['slug'=>'jablka',    'name'=>'Jablka',    'name_plural'=>'Jablek',   'sort_order'=>4, 'visible'=>true],
            ['slug'=>'jahody',    'name'=>'Jahody',    'name_plural'=>'Jahod',    'sort_order'=>5, 'visible'=>true],
            ['slug'=>'brambory',  'name'=>'Brambory',  'name_plural'=>'Brambor',  'sort_order'=>6, 'visible'=>true],
            ['slug'=>'boruvky',   'name'=>'Borůvky',   'name_plural'=>'Borůvek',  'sort_order'=>7, 'visible'=>false], // prázdná
        ];

        foreach ($categories as $cat) {
            \App\Models\Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }

        $rajcata = \App\Models\Category::where('slug', 'rajcata')->first();
        $jablka  = \App\Models\Category::where('slug', 'jablka')->first();

        // Odrůdy rajčat
        $varietiesRajcata = [
            [
                'slug'             => 'stupicke-polni',
                'name'             => 'Odrůda rajčat Stupické polní rané',
                'ripening_sort_key'=> 2,
                'ripening_label'   => 'raná',
                'color'            => 'červená',
                'fruit_size'       => 'střední',
                'fruit_weight'     => '60–80 g',
                'taste_profile'    => 'sladká, aromatická',
                'use_cases'        => ['konzum', 'saláty', 'zavařování'],
                'disease_resistance'=> ['plíseň bramborová'],
                'excerpt'          => 'Česká klasika. Raná, velmi spolehlivá odrůda rajčete vhodná pro venkovní pěstování i ve skleníku.',
                'description_html' => '<h2>O odrůdě</h2><p>Stupické polní rané je jedna z nejoblíbenějších českých odrůd rajčete. Pochází ze šlechtitelské stanice ve Stupicích a je šlechtěna přímo pro české klimatické podmínky.</p><h2>Vlastnosti plodů</h2><p>Plody jsou kulatého tvaru, jasně červené barvy, s příjemně sladkou a aromatickou chutí. Hmotnost plodů se pohybuje mezi 60 a 80 gramy.</p><h2>Pěstování</h2><p>Odrůda je vhodná pro venkovní pěstování i skleník. Dobře snáší proměnlivé počasí typické pro české léto. Rostlina je tyčková a vyžaduje oporu.</p>',
                'status'           => 'published',
                'quality_score'    => 3,
            ],
            [
                'slug'             => 'moneymaker',
                'name'             => 'Odrůda rajčat Moneymaker',
                'ripening_sort_key'=> 3,
                'ripening_label'   => 'poloraná',
                'color'            => 'červená',
                'fruit_size'       => 'střední',
                'fruit_weight'     => '80–100 g',
                'taste_profile'    => 'jemná, vyrovnaná',
                'use_cases'        => ['konzum', 'saláty'],
                'disease_resistance'=> [],
                'excerpt'          => 'Britská klasika. Spolehlivá výnosnná odrůda tyčkového rajčete s pravidelnými plody.',
                'description_html' => '<h2>O odrůdě</h2><p>Moneymaker je britská odrůda, která si díky své spolehlivosti a pravidelnému tvaru plodů získala popularitu po celé Evropě. Jde o indeterminantní (tyčkový) typ rajčete s velmi vyrovnaným výnosem.</p><h2>Vlastnosti plodů</h2><p>Plody jsou kulaté, hladké, rovnoměrně červené. Chuť je mírná a vyrovnaná, bez přebytku kyseliny.</p>',
                'status'           => 'published',
                'quality_score'    => 2,
            ],
            [
                'slug'             => 'golden-nugget',
                'name'             => 'Odrůda rajčat Golden Nugget',
                'ripening_sort_key'=> 2,
                'ripening_label'   => 'raná',
                'color'            => 'žlutá',
                'fruit_size'       => 'malé',
                'fruit_weight'     => '20–30 g',
                'taste_profile'    => 'velmi sladká, ovocná',
                'use_cases'        => ['konzum', 'saláty'],
                'disease_resistance'=> [],
                'excerpt'          => 'Zlatá třešňová rajčata s výjimečně sladkou chutí. Ideální pro děti a přímý konzum.',
                'description_html' => '<h2>O odrůdě</h2><p>Golden Nugget je keříčkový typ rajčete se žlutými třešňovými plody. Vyznačuje se mimořádně sladkou chutí a ranou sklizní.</p><h2>Pěstování</h2><p>Vhodné pro balkon i zahradu. Keříčkový typ nevyžaduje oporu ani vylamování postranních výhonů.</p>',
                'status'           => 'published',
                'quality_score'    => 3,
            ],
        ];

        foreach ($varietiesRajcata as $v) {
            \App\Models\Variety::firstOrCreate(
                ['category_id' => $rajcata->id, 'slug' => $v['slug']],
                array_merge($v, ['category_id' => $rajcata->id])
            );
        }

        // Odrůdy jablek
        $varietiesJablka = [
            [
                'slug'             => 'bohemia',
                'name'             => 'Odrůda jablka Bohemia',
                'ripening_sort_key'=> 5,
                'ripening_label'   => 'pozdní',
                'color'            => 'červená',
                'fruit_size'       => 'velké',
                'fruit_weight'     => '180–220 g',
                'taste_profile'    => 'sladkokyselá, aromatická',
                'use_cases'        => ['konzum', 'džemy', 'kompoty'],
                'disease_resistance'=> ['strupovitost'],
                'origin_country'   => 'ČR',
                'excerpt'          => 'Česká odrůda s vynikající trvanlivostí. Plody dozrávají v říjnu a vydrží do března.',
                'description_html' => '<h2>O odrůdě</h2><p>Bohemia je česká odrůda jablka vzniklá křížením odrůd Cox Orange Pippin × Oldenburg. Šlechtěna v Holovousích a registrovaná v roce 1982.</p><h2>Plody</h2><p>Velká, pravidelně kulatá jablka s jasně červenou slupkou přes žlutozelený podklad. Dužnina je jemná, šťavnatá, sladkokyselé chuti s výraznou aromatičností.</p><h2>Sklizeň a skladování</h2><p>Sklizeň v říjnu. Trvanlivost výjimečná — při správném skladování (chlad, vysoká vlhkost) vydrží až do března.</p>',
                'status'           => 'published',
                'quality_score'    => 3,
            ],
        ];

        foreach ($varietiesJablka as $v) {
            \App\Models\Variety::firstOrCreate(
                ['category_id' => $jablka->id, 'slug' => $v['slug']],
                array_merge($v, ['category_id' => $jablka->id])
            );
        }

        // Blog post
        \App\Models\BlogPost::firstOrCreate(['slug' => 'jak-pestovat-rajcata'], [
            'title'        => 'Jak pěstovat rajčata – průvodce pro začátečníky',
            'excerpt'      => 'Rajčata jsou jednou z nejoblíbenějších zelenin na české zahrádce. Poradíme vám, jak je správně vysadit, přihnojit a ošetřit.',
            'content_html' => '<h2>Příprava</h2><p>Rajčata vysazujte do záhonu nebo nádoby po 10. květnu, kdy nehrozí pozdní mrazy. Připravte úrodnou, propustnou zeminu.</p><h2>Výsadba</h2><p>Sázejte do hloubky tak, aby bylo zakopáno i spodní lístí — z pohřbeného stonku vyrostou přídatné kořeny.</p><h2>Zálivka</h2><p>Zalévejte pravidelně, ale nepřelévejte. Rajčata nesnáší výkyvy vlhkosti — způsobují praskání plodů.</p>',
            'status'       => 'published',
            'published_at' => now()->subDays(7),
        ]);

        echo "Seed OK: " . \App\Models\Category::count() . " kategorií, " . \App\Models\Variety::count() . " odrůd, " . \App\Models\BlogPost::count() . " blogpostů\n";
    }
}
