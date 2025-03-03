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
        return Inertia::render('list', [
            'rules' => $rules,
        ]);
    }

    public function new(Request $request)
    {
        return Inertia::render('new', [
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
            'target_template' => 'required|string'
        ]);

        $sourcePath = rtrim($request['source_dir'], '/') . '/';
        $targetPath = rtrim($request['target_dir'], '/') . '/';

        $rule = Rule::updateOrCreate(
            [
                'source_dir' => $sourcePath,
                'target_dir' => $targetPath,
            ],
            [
                'include_pattern' => $request['include_pattern'],
                'exclude_pattern' => $request['exclude_pattern'],
                'target_template' => $request['target_template']
            ]
        );

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
        $subDirs = $this->getAllSubDirectories($targetDir);

        usort($subDirs, function($a, $b) {
            return substr_count($b, '/') - substr_count($a, '/');
        });

        foreach ($subDirs as $dir) {
            if (File::isDirectory($dir)) {
                $this->safeRemoveDir($dir);
            }
        }

        $this->safeRemoveDir($targetDir);
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