<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

#[Signature('project-tracker:mcp-token {email : Email admin pemilik token} {--days=90 : Masa berlaku token dalam hari}')]
#[Description('Issue and rotate a least-privilege bearer token for the Project Tracker MCP')]
class IssueProjectTrackerMcpToken extends Command
{
    private const TOKEN_NAME = 'Codex Project Tracker Production';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = Str::of((string) $this->argument('email'))->trim()->lower()->toString();
        $days = filter_var($this->option('days'), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($days === false) {
            $this->error('Opsi --days harus berupa bilangan bulat positif.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $this->error('User aktif dengan email tersebut tidak ditemukan.');

            return self::FAILURE;
        }

        if (! $user->isAdmin()) {
            $this->error('Pemilik token harus memiliki role admin.');

            return self::FAILURE;
        }

        $user->tokens()->where('name', self::TOKEN_NAME)->delete();

        $token = $user->createToken(
            self::TOKEN_NAME,
            ['mcp:use'],
            now()->addDays($days),
        );

        $this->warn('Simpan token berikut sebagai secret environment. Nilainya hanya ditampilkan sekali.');
        $this->line('PROJECT_TRACKER_MCP_TOKEN='.$token->plainTextToken);

        return self::SUCCESS;
    }
}
