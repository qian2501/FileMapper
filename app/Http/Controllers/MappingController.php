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
                'source' => $file->getFilename()
            ];
        }
        
        return response()->json([
            'entries' => $entries,
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
            $processed = false;
            $targetName = preg_replace($request['include_pattern'], $request['target_template'], $file->getFilename());
        
            if ($rule) {
                $mapping = Mapping::where('rule_id', $rule->id)
                    ->where('source_name', $file->getFilename())
                    ->where('target_name', $targetName)
                    ->first();
                
                if ($mapping) {
                    $processed = $mapping->processed;
                }
            }

            $entries[] = [
                'source' => $file->getFilename(),
                'target' => $targetName,
                'processed' => $processed,
            ];
        }

        return response()->json([
            'entries' => $entries,
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

        $rule = Rule::where('source_dir', $sourcePath)
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
        }

        $files = $this->getFiles($request);
        $entries = [];

        foreach ($files as $file) {
            $sourceName = $file->getFilename();
            $targetName = preg_replace($request['include_pattern'], $request['target_template'], $file->getFilename());
            
            $mapping = Mapping::where('rule_id', $rule->id)
                ->where('source_name', $sourceName)
                ->first();
            
            if ($mapping) {
                if ($mapping->target_name !== $targetName) {
                    if (File::exists($targetPath.$mapping->target_name)) {
                        File::delete($targetPath.$mapping->target_name);
                    }

                    $this->hardLinking($sourcePath.$sourceName, $targetPath.$targetName);
    
                    $mapping->update([
                        'target_name' => $targetName,
                    ]);
                }
            } else {
                $mapping = Mapping::create([
                    'rule_id' => $rule->id,
                    'source_name' => $sourceName,
                    'target_name' => $targetName,
                ]);

                $this->hardLinking($sourcePath.$sourceName, $targetPath.$targetName);

                $mapping->update([
                    'processed' => true,
                ]);
            }

            $entries[] = [
                'source' => $mapping->source_name,
                'target' => $mapping->target_name,
                'processed' => $mapping->processed
            ];
        }

        return response()->json([
            'entries' => $entries,
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
    
        $rule->delete();
    
        return redirect()->back();
    }

    private function getFiles($request)
    {
        $files = collect(File::allFiles($request->source_dir));
    
        $files = $files->filter(fn ($file) => preg_match($request->include_pattern, $file->getFilename()));
        
        if ($request->exclude_pattern) {
            $files = $files->reject(fn ($file) => preg_match($request->exclude_pattern, $file->getFilename()));
        }

        return $files;
    }

    private function hardLinking($source, $target)
    {
        $targetDir = dirname($target);
        if (!File::exists($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }
        if (!File::exists($target)) {
            File::link($source, $target);
        }
    }
}