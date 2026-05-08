<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('banner_caption');
        });

        Schema::table('form_fields', function (Blueprint $table) {
            $table->boolean('is_append')->default(false)->after('order');
        });
    }

    public function down(): void
    {
        Schema::table('form_fields', function (Blueprint $table) {
            $table->dropColumn('is_append');
        });

        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};
