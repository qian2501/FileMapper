<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mapping extends Model
{
    protected $fillable = [
        'rule_id',
        'source_name',
        'target_name',
        'processed',
    ];

    protected $guarded = [];
    
    public function rule()
    {
        return $this->belongsTo(Rule::class);
    }
}
