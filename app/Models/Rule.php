<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rule extends Model
{
    protected $fillable = [
        'source_dir',
        'target_dir',
        'include_pattern',
        'exclude_pattern',
        'target_template',
    ];

    protected $casts = [
        'include_pattern' => 'array',
        'exclude_pattern' => 'array',
    ];

    public function mappings()
    {
        return $this->hasMany(Mapping::class);
    }
}
