<?php

namespace App\Models;

use CodeIgniter\Model;

class InspectionModel extends Model
{
    protected $table = 'inspections';
    protected $primaryKey = 'id';

    protected $returnType = 'array';

    protected $allowedFields = [
        'sme_id',
        'planned_date',
        'inspection_type',
        'authority',
        'basis',
        'status',
        'comment',
    ];

    protected $useTimestamps = true;
    protected $useSoftDeletes = true;
    protected $dateFormat = 'datetime';

    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';
    protected $deletedField = 'deleted_at';
}