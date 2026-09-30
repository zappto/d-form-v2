<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('email_broadcasts')) {
            return;
        }

        if ($this->indexExists('email_broadcasts', 'email_broadcasts_status_scheduled_at_idx')) {
            return;
        }

        Schema::table('email_broadcasts', function (Blueprint $table): void {
            $table->index(['status', 'scheduled_at'], 'email_broadcasts_status_scheduled_at_idx');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('email_broadcasts')) {
            return;
        }

        if (! $this->indexExists('email_broadcasts', 'email_broadcasts_status_scheduled_at_idx')) {
            return;
        }

        Schema::table('email_broadcasts', function (Blueprint $table): void {
            $table->dropIndex('email_broadcasts_status_scheduled_at_idx');
        });
    }

    /** Cek keberadaan index lintas driver (mysql/sqlite/pgsql). */
    private function indexExists(string $table, string $index): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            $rows = DB::select(
                'SELECT 1
                 FROM information_schema.statistics
                 WHERE table_schema = DATABASE()
                   AND table_name = ?
                   AND index_name = ?
                 LIMIT 1',
                [$table, $index]
            );

            return $rows !== [];
        }

        if ($driver === 'sqlite') {
            $rows = DB::select(
                "SELECT 1 FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ? LIMIT 1",
                [$table, $index]
            );

            return $rows !== [];
        }

        if ($driver === 'pgsql') {
            $rows = DB::select(
                'SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ? LIMIT 1',
                [$table, $index]
            );

            return $rows !== [];
        }

        return false;
    }
};
