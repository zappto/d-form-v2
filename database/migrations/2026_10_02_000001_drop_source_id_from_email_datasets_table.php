<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('email_datasets', function (Blueprint $table): void {
            if (Schema::hasColumn('email_datasets', 'source_id')) {
                $table->dropColumn('source_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('email_datasets', function (Blueprint $table): void {
            if (! Schema::hasColumn('email_datasets', 'source_id')) {
                $table->string('source_id', 100)->nullable();
            }
        });
    }
};
