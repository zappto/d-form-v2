<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            $this->ensureMysqlColumnIndex('form_answers', 'user_id', 'form_answers_user_id_index');
            $this->ensureMysqlColumnIndex('form_answers', 'form_id', 'form_answers_form_id_index');
        }

        if ($this->indexExists('form_answers', 'form_answers_user_form_unique')) {
            Schema::table('form_answers', function (Blueprint $table): void {
                $table->dropUnique('form_answers_user_form_unique');
            });
        }

        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            DB::statement(
                "CREATE UNIQUE INDEX form_answers_active_user_form_unique "
                ."ON form_answers (user_id, form_id) "
                ."WHERE COALESCE(review_status, '') != 'rejected' "
                ."AND NOT (registration_role = 'member' AND member_confirmation_status IN ('rejected', 'expired'))"
            );
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            DB::statement('DROP INDEX IF EXISTS form_answers_active_user_form_unique');
        }

        if (! $this->indexExists('form_answers', 'form_answers_user_form_unique')) {
            Schema::table('form_answers', function (Blueprint $table): void {
                $table->unique(['user_id', 'form_id'], 'form_answers_user_form_unique');
            });
        }

        if ($driver === 'mysql') {
            if ($this->indexExists('form_answers', 'form_answers_user_id_index')) {
                Schema::table('form_answers', function (Blueprint $table): void {
                    $table->dropIndex('form_answers_user_id_index');
                });
            }

            if ($this->indexExists('form_answers', 'form_answers_form_id_index')) {
                Schema::table('form_answers', function (Blueprint $table): void {
                    $table->dropIndex('form_answers_form_id_index');
                });
            }
        }
    }

    private function ensureMysqlColumnIndex(string $table, string $column, string $indexName): void
    {
        if ($this->indexExists($table, $indexName)) {
            return;
        }

        // InnoDB may bind user_id/form_id foreign keys to the composite unique index.
        // Add dedicated indexes first so the unique can be dropped safely.
        Schema::table($table, function (Blueprint $table) use ($column, $indexName): void {
            $table->index($column, $indexName);
        });
    }

    private function indexExists(string $table, string $indexName): bool
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
                [$table, $indexName]
            );

            return $rows !== [];
        }

        if ($driver === 'sqlite') {
            $rows = DB::select(
                "SELECT 1 FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ? LIMIT 1",
                [$table, $indexName]
            );

            return $rows !== [];
        }

        if ($driver === 'pgsql') {
            $rows = DB::select(
                'SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ? LIMIT 1',
                [$table, $indexName]
            );

            return $rows !== [];
        }

        return false;
    }
};
