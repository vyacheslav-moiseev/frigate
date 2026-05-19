<?php

namespace App\Models;

use CodeIgniter\Model;

class SmeModel extends Model
{
    protected $table = 'smes';
    protected $primaryKey = 'id';

    protected $returnType = 'array';

    protected $allowedFields = [
        'inn',
        'name',
        'address',
    ];

    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
}