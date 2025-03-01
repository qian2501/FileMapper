<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rules', function (Blueprint $table) {
            $table->id();
            $table->string('source_dir');
            $table->string('target_dir');
            $table->text('include_pattern'); // 包含正则表达式
            $table->text('exclude_pattern')->nullable(); // 排除正则表达式
            $table->string('target_template'); // 目标文件名模板
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rules');
    }
};
