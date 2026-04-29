<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create
                            {email : E-mail}
                            {--name= : Jméno}
                            {--password= : Heslo (pokud nezadáno, vygeneruje se náhodné silné)}';

    protected $description = 'Vytvoří nebo aktualizuje admin uživatele';

    public function handle(): int
    {
        $email = $this->argument('email');
        $name  = $this->option('name') ?? 'Admin';
        $password = $this->option('password') ?? Str::random(20);
        $generated = !$this->option('password');

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => $name,
                'password' => Hash::make($password),
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        $action = $user->wasRecentlyCreated ? '✅ Vytvořen' : '✅ Aktualizován';

        $this->info("{$action} admin uživatel:");
        $this->line("   E-mail:   {$email}");
        $this->line("   Jméno:    {$name}");
        if ($generated) {
            $this->newLine();
            $this->warn('⚠️  HESLO (zapiš si, už neuvidíš):');
            $this->line("   " . str_repeat('═', 30));
            $this->line("   {$password}");
            $this->line("   " . str_repeat('═', 30));
        }
        $this->newLine();
        $this->info('🔐 Přihlásit: http://127.0.0.1:8000/admin/login');

        return 0;
    }
}
