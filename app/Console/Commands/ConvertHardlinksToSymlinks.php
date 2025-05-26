<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use App\Models\Mapping;
use App\Models\Rule;

class ConvertHardlinksToSymlinks extends Command
{
    protected $signature = 'mappings:convert-to-symlinks 
        {--batch=100 : Number of mappings to process per batch}
        {--dry-run : Show what would be done without making changes}';

    protected $description = 'Convert existing hardlinks to symbolic links';

    public function handle()
    {
        $batchSize = (int)$this->option('batch');
        $isDryRun = $this->option('dry-run');

        $total = Mapping::count();
        $processed = 0;
        $converted = 0;
        $errors = 0;

        Mapping::with('rule')->chunk($batchSize, function ($mappings) use ($isDryRun, &$processed, &$converted, &$errors) {
            foreach ($mappings as $mapping) {
                $processed++;
                $targetPath = $mapping->rule->target_dir . $mapping->target_name;

                try {
                    if (!File::exists($targetPath)) {
                        $this->warn("Skipping missing target: {$targetPath}");
                        continue;
                    }

                    // Check if already a symlink
                    if (is_link($targetPath)) {
                        $this->info("Already symlink: {$targetPath}");
                        continue;
                    }

                    // Get source path
                    $sourcePath = $mapping->rule->source_dir . $mapping->source_name;
                    if (!File::exists($sourcePath)) {
                        $this->warn("Source file missing: {$sourcePath}");
                        $errors++;
                        continue;
                    }

                    if ($isDryRun) {
                        $this->info("[DRY RUN] Would convert: {$targetPath}");
                        $converted++;
                        continue;
                    }

                    // Convert to symlink
                    File::delete($targetPath);
                    symlink(realpath($sourcePath), $targetPath);

                    $this->info("Converted: {$targetPath}");
                    $converted++;
                } catch (\Exception $e) {
                    $this->error("Error converting {$targetPath}: " . $e->getMessage());
                    $errors++;
                }
            }
        });

        $this->line("\nConversion summary:");
        $this->line("Total mappings: {$total}");
        $this->line("Processed: {$processed}");
        $this->line("Converted: {$converted}");
        $this->line("Errors: {$errors}");

        return $errors === 0 ? 0 : 1;
    }
}
