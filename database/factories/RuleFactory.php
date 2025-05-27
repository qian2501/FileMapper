<?php

namespace Database\Factories;

use App\Models\Rule;
use Illuminate\Database\Eloquent\Factories\Factory;

class RuleFactory extends Factory
{
    protected $model = Rule::class;

    public function definition()
    {
        return [
            'source_dir' => '/home/user/' . $this->faker->word,
            'target_dir' => '/backup/' . $this->faker->word,
            'include_pattern' => ['*.' . $this->faker->fileExtension],
            'exclude_pattern' => [$this->faker->word . '/*'],
            'target_template' => '{filename}_' . $this->faker->randomElement(['{date}', '{timestamp}', '{year}']),
        ];
    }
}
