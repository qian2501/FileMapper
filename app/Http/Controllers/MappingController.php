<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use App\Models\Rule;
use App\Models\Mapping;
use Inertia\Inertia;

class MappingController extends Controller
{
    public function index(Request $request)
    {
        $rules = Rule::with('mappings')->get();
        return Inertia::render('List', [
            'rules' => $rules,
        ]);
    }

    public function new(Request $request)
    {
        return Inertia::render('New', [
        ]);
    }

    public function edit(Rule $rule)
    {
        return Inertia::render('Edit', [
            'rule' => [
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

            $newFilename = preg_replace(
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

    public function apply(Request $request)
    {
        $request->validate([
            'source_dir' => 'required|string',
            'target_dir' => 'required|string',
            'include_pattern' => 'required|string',
            'exclude_pattern' => 'nullable|string',
            'target_template' => 'required|string',
            'rule_id' => 'nullable|exists:rules,id'
        ]);

        $sourcePath = rtrim($request['source_dir'], '/') . '/';
        $targetPath = rtrim($request['target_dir'], '/') . '/';

        $rule = $request->rule_id 
            ? Rule::findOrFail($request->rule_id)
            : Rule::where('source_dir', $sourcePath)
                ->where('target_dir', $targetPath)
                ->first();

        if (!$rule) {
            $rule = Rule::create([
                'source_dir' => $sourcePath,
                'target_dir' => $targetPath,
                'include_pattern' => $request['include_pattern'],
                'exclude_pattern' => $request['exclude_pattern'],
                'target_template' => $request['target_template']
            ]);
        } else {
            $oldSourcePath = $rule->source_dir;
            $oldTargetPath = $rule->target_dir;
    
            if ($oldSourcePath !== $sourcePath || $oldTargetPath !== $targetPath) {                
                foreach ($rule->mappings as $mapping) {
                    $oldTargetFile = $oldTargetPath . $mapping->target_name;
                    if (File::exists($oldTargetFile)) {
                        File::delete($oldTargetFile);
                    }
                }

                // Clean up empty directories
                $this->cleanupEmptyDirectories($oldTargetPath);
            }

            $rule->update([
                'source_dir' => $sourcePath,
                'target_dir' => $targetPath,
                'include_pattern' => $request['include_pattern'],
                'exclude_pattern' => $request['exclude_pattern'],
                'target_template' => $request['target_template']
            ]);
        }

        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $relativePath = $file->getRelativePathname();
            $pathInfo = pathinfo($relativePath);
            $filename = $pathInfo['basename'];
            $dir = $pathInfo['dirname'] !== '.' ? $pathInfo['dirname'] . '/' : '';

            $newFilename = preg_replace(
                $request['include_pattern'],
                $request['target_template'],
                $filename
            );
            $targetName = $dir . $newFilename;

            $mapping = Mapping::updateOrCreate(
                [
                    'rule_id' => $rule->id,
                    'source_name' => $relativePath
                ],
                ['target_name' => $targetName]
            );

            $sourceFull = $sourcePath . $relativePath;
            $targetFull = $targetPath . $targetName;

            if ($mapping->target_name !== $targetName) {
                if (File::exists($targetPath . $mapping->target_name)) {
                    File::delete($targetPath . $mapping->target_name);
                }
                $mapping->update(['target_name' => $targetName]);
            }

            if (!$mapping->processed || !File::exists($targetFull)) {
                $this->hardLinking($sourceFull, $targetFull);
                $mapping->update(['processed' => true]);
            }

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

    private function hardLinking($source, $target)
    {
        $targetDir = dirname($target);
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }
        if (!File::exists($target)) {
            link($source, $target);
        }
    }
}
