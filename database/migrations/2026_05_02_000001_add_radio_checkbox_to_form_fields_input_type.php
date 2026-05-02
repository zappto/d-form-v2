<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE form_fields MODIFY COLUMN input_type
             ENUM('input','selectInput','textarea','datePicker','fileUpload','radio','checkbox')
             NOT NULL DEFAULT 'input'"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE form_fields MODIFY COLUMN input_type
             ENUM('input','selectInput','textarea','datePicker','fileUpload')
             NOT NULL DEFAULT 'input'"
        );
    }
};
