<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Auth;
use App\Models\Rule;
use App\Models\Mapping;
use Inertia\Inertia;

class MappingController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        
        $rules = Rule::with('mappings')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends($request->except('page'));

        return Inertia::render('List', [
            'paginatedRules' => $rules->toArray()
        ]);
    }

    public function create(Request $request)
    {
        $profile = Auth::user()->profile;
        return Inertia::render('RuleForm', [
            'initialData' => $profile ? [
                'source_dir' => $profile->source_dir,
                'target_dir' => $profile->target_dir,
                'include_pattern' => $profile->include_pattern,
                'exclude_pattern' => $profile->exclude_pattern,
                'target_template' => $profile->target_template,
            ] : [],
            'isOnetime' => $request->has('onetime')
        ]);
    }

    public function onetime(Request $request)
    {
        $profile = Auth::user()->profile;
        return Inertia::render('RuleForm', [
            'initialData' => $profile ? [
                'source_dir' => $profile->source_dir,
                'target_dir' => $profile->target_dir,
                'include_pattern' => $profile->include_pattern,
                'exclude_pattern' => $profile->exclude_pattern,
                'target_template' => $profile->target_template,
            ] : [],
            'isOnetime' => true
        ]);
    }

    public function edit(Rule $rule)
    {
        return Inertia::render('RuleForm', [
            'initialData' => [
                'id' => $rule->id,
                'source_dir' => $rule->source_dir,
                'target_dir' => $rule->target_dir,
                'include_pattern' => $rule->include_pattern,
                'exclude_pattern' => $rule->exclude_pattern,
                'target_template' => $rule->target_template,
                'mappings' => $rule->mappings->map(function($mapping) {
                    return [
                        'source_name' => $mapping->source_name,
                        'target_name' => $mapping->target_name,
                        'processed' => $mapping->processed
                    ];
                })->toArray()
            ]
        ]);
    }

    public function scan(Request $request)
    {
        $request->validate([
            'source_dir' => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
        ]);

        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $entries[] = [
                'source' => $file->getRelativePathname()
            ];
        }
        
        return response()->json([
            'entries' => $entries
        ]);
    }

    public function preview(Request $request)
    {
        $request->validate([
            'source_dir' => 'required|string',
            'target_dir' => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'required|string'
        ]);

        $sourcePath = rtrim($request['source_dir'], '/') . '/';
        $targetPath = rtrim($request['target_dir'], '/') . '/';

        $rule = Rule::where('source_dir', $sourcePath)
            ->where('target_dir', $targetPath)
            ->first();
        
        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $pathInfo = pathinfo($relativePath);
            $filename = $pathInfo['basename'];
            $dir = $pathInfo['dirname'] !== '.' ? $pathInfo['dirname'] . '/' : '';

            $newFilename = $this->processFilename(
                $request['include_pattern'],
                $request['target_template'],
                $filename
            );
            $targetName = $dir . $newFilename;

            $processed = false;
            if ($rule) {
                $mapping = Mapping::where('rule_id', $rule->id)
                    ->where('source_name', $relativePath)
                    ->where('target_name', $targetName)
                    ->first();
                
                $processed = $mapping->processed ?? false;
            }

            $entries[] = [
                'source' => $relativePath,
                'target' => $targetName,
                'processed' => $processed,
            ];
        }

        return response()->json([
            'entries' => $entries
        ]);
    }

    public function applyOnce(Request $request)
    {
        $request->validate([
            'source_dir' => 'required|string',
            'target_dir' => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'required|string',
            'keep_original' => 'required|boolean'
        ]);

        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $pathInfo = pathinfo($relativePath);
            $filename = $pathInfo['basename'];
            $dir = $pathInfo['dirname'] !== '.' ? $pathInfo['dirname'] . '/' : '';

            $newFilename = $this->processFilename(
                $request['include_pattern'],
                $request['target_template'],
                $filename
            );
            $targetName = $dir . $newFilename;

            $sourceFull = $request['source_dir'] . $relativePath;
            $targetFull = $request['target_dir'] . $targetName;

            if ($request['keep_original']) {
                $this->linking($sourceFull, $targetFull);
            } else {
                $this->moveFile($sourceFull, $targetFull);
            }
            
            $entries[] = [
                'source' => $relativePath,
                'target' => $targetName,
                'status' => $request['keep_original'] ? 'linked' : 'moved'
            ];
        }

        return response()->json(['entries' => $entries]);
    }

    public function apply(Request $request)
    {
        $request->validate([
            'source_dir' => 'required|string',
            'target_dir' => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'required|string'
        ]);

        $sourcePath = rtrim($request['source_dir'], '/') . '/';
        $targetPath = rtrim($request['target_dir'], '/') . '/';

        $rule = Rule::create([
            'source_dir' => $sourcePath,
            'target_dir' => $targetPath,
            'include_pattern' => $request['include_pattern'],
            'exclude_pattern' => $request['exclude_pattern'],
            'target_template' => $request['target_template']
        ]);

        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $pathInfo = pathinfo($relativePath);
            $filename = $pathInfo['basename'];
            $dir = $pathInfo['dirname'] !== '.' ? $pathInfo['dirname'] . '/' : '';

            $newFilename = $this->processFilename(
                $request['include_pattern'],
                $request['target_template'],
                $filename
            );
            $targetName = $dir . $newFilename;

            // First get existing mapping if any
            $mapping = Mapping::create([
                'rule_id' => $rule->id,
                'source_name' => $relativePath,
                'target_name' => $targetName
            ]);

            if (File::exists($targetPath . $targetName)) {
                // error
            }

            $this->linking($sourcePath . $relativePath, $targetPath . $targetName);
            $mapping->update(['processed' => true]);

            $entries[] = [
                'source' => $relativePath,
                'target' => $targetName,
                'processed' => $mapping->processed,
            ];
        }

        return response()->json([
            'entries' => $entries
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'source_dir'      => 'required|string',
            'target_dir'      => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'required|string',
            'rule_id'         => 'required|exists:rules,id'
        ]);

        $sourcePath = rtrim($request['source_dir'], '/') . '/';
        $targetPath = rtrim($request['target_dir'], '/') . '/';

        // Get the rule and old paths
        $rule = Rule::find($request['rule_id']);
        $oldSourcePath = $rule->source_dir;
        $oldTargetPath = $rule->target_dir;

        // Update the rule
        $rule->update([
            'source_dir' => $sourcePath,
            'target_dir' => $targetPath,
            'include_pattern' => $request['include_pattern'],
            'exclude_pattern' => $request['exclude_pattern'],
            'target_template' => $request['target_template']
        ]);

        // Handle path changes
        if ($oldSourcePath !== $sourcePath || $oldTargetPath !== $targetPath) {
            foreach ($rule->mappings as $mapping) {
                $oldTargetFull = $oldTargetPath . $mapping->target_name;
                if (File::exists($oldTargetFull)) {
                    File::delete($oldTargetFull);
                }
            }

            if (File::exists($oldTargetPath)) {
                $this->cleanupEmptyDirectories($oldTargetPath);
            }
        }

        // Get current mappings
        $existingMappings = $rule->mappings()->get()->keyBy('source_name');
        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $pathInfo = pathinfo($relativePath);
            $filename = $pathInfo['basename'];
            $dir = $pathInfo['dirname'] !== '.' ? $pathInfo['dirname'] . '/' : '';

            $newFilename = $this->processFilename(
                $request['include_pattern'],
                $request['target_template'],
                $filename
            );
            $targetName = $dir . $newFilename;

            // Update or create mapping
            if ($existingMappings->has($relativePath)) {
                $mapping = $existingMappings[$relativePath];
                $oldTargetFull = $oldTargetPath . $mapping->target_name;
                if (File::exists($oldTargetFull)) {
                    File::delete($oldTargetFull);
                }
                $mapping->update([
                    'target_name' => $targetName,
                    'processed' => false
                ]);
            } else {
                $mapping = Mapping::create([
                    'rule_id' => $rule->id,
                    'source_name' => $relativePath,
                    'target_name' => $targetName,
                    'processed' => false
                ]);
            }

            // Process the file if not already processed
            if (!$mapping->processed) {
                $sourceFull = $sourcePath . $relativePath;
                $targetFull = $targetPath . $targetName;

                if (File::exists($targetFull)) {
                    continue;
                }

                $this->linking($sourceFull, $targetFull);
                $mapping->update(['processed' => true]);
            }

            $entries[] = [
                'source' => $relativePath,
                'target' => $targetName,
                'processed' => $mapping->processed,
            ];
        }

        // Clean up mappings and files that no longer exist
        $currentSourceNames = $files->map(fn($file) => $file->getRelativePathname())->toArray();
        $obsoleteMappings = $rule->mappings()
            ->whereNotIn('source_name', $currentSourceNames)
            ->get();

        foreach ($obsoleteMappings as $mapping) {
            $targetFile = $oldTargetPath . $mapping->target_name;
            if (File::exists($targetFile)) {
                File::delete($targetFile);
            }
            $mapping->delete();
        }

        // Clean up empty directories
        if (File::exists($oldTargetPath)) {
            $this->cleanupEmptyDirectories($oldTargetPath);
        }

        return response()->json([
            'entries' => $entries
        ]);
    }

    public function delete(Request $request)
    {
        $request->validate([
            'rule_id' => 'required|exists:rules,id',
        ]);

        $rule = Rule::findOrFail($request->rule_id);
        $mappings = Mapping::where('rule_id', $rule->id)->get();

        foreach ($mappings as $mapping) {
            $targetFile = $rule->target_dir . $mapping->target_name;
            if (File::exists($targetFile)) {
                File::delete($targetFile);
            }
            $mapping->delete();
        }

        $targetDir = rtrim($rule->target_dir, '/');
        $this->cleanupEmptyDirectories($targetDir);
        $rule->delete();

        return redirect()->back();
    }

    private function getFiles($request)
    {
        $files = collect(File::allFiles($request->source_dir));

        $files = $files->filter(function ($file) use ($request) {
            $relativePath = $file->getRelativePathname();
            return preg_match($request->include_pattern, $relativePath);
        });

        if ($request->exclude_pattern) {
            $files = $files->reject(function ($file) use ($request) {
                $relativePath = $file->getRelativePathname();
                return preg_match($request->exclude_pattern, $relativePath);
            });
        }

        return $files;
    }

    private function getAllSubDirectories(string $dir): array
    {
        $subDirs = File::directories($dir);
        $allDirs = [];

        foreach ($subDirs as $subDir) {
            $allDirs[] = $subDir;
            $allDirs = array_merge($allDirs, $this->getAllSubDirectories($subDir));
        }

        return $allDirs;
    }

    private function safeRemoveDir(string $path): void
    {
        if (!File::isDirectory($path)) {
            return;
        }

        if (count(File::files($path)) === 0 && count(File::directories($path)) === 0) {
            @rmdir($path);
        }
    }

    private function cleanupEmptyDirectories(string $baseDir): void
    {
        $dirsToCheck = [];

        // Get all subdirectories under base dir
        $subDirs = $this->getAllSubDirectories($baseDir);
        foreach ($subDirs as $dir) {
            $dirsToCheck[$dir] = true;
        }

        // Also check parent directories up the tree
        $parentDir = dirname($baseDir);
        while ($parentDir !== '/' && $parentDir !== '.') {
            $dirsToCheck[$parentDir] = true;
            $parentDir = dirname($parentDir);
        }

        // Sort by deepest first
        $sortedDirs = array_keys($dirsToCheck);
        usort($sortedDirs, function($a, $b) {
            return substr_count($b, '/') - substr_count($a, '/');
        });

        // Remove empty directories
        foreach ($sortedDirs as $dir) {
            if (File::isDirectory($dir)) {
                $this->safeRemoveDir($dir);
            }
        }
    }

    private function processFilename($pattern, $template, $filename)
    {
        return preg_replace_callback($pattern, function($matches) use ($template) {
            return preg_replace_callback('/\$(\d+)([+-]\d+)?/', function($m) use ($matches) {
                $index = $m[1];
                $value = $matches[$index] ?? '';
                
                if (is_numeric($value) && isset($m[2])) {
                    $operator = $m[2][0];
                    $operand = substr($m[2], 1);
                    return $operator === '+' 
                        ? $value + $operand
                        : $value - $operand;
                }
                return $value;
            }, $template);
        }, $filename);
    }

    private function linking($source, $target)
    {
        $targetDir = dirname($target);
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }
        if (!File::exists($target)) {
            // Convert to use absolute paths for symlinks
            $source = realpath($source);
            // Ensure UTF-8 encoding for Chinese characters
            $target = mb_convert_encoding($target, 'UTF-8');
            symlink($source, $target);
        }
    }

    private function moveFile($source, $target)
    {
        $targetDir = dirname($target);
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }
        if (!File::exists($target)) {
            File::move($source, $target);
        }
    }
}
