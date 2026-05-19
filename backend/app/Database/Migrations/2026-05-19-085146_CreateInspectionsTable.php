<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateInspectionsTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'auto_increment' => true,
            ],
            'sme_id' => [
                'type' => 'INT',
                'null' => false,
            ],
            'planned_date' => [
                'type' => 'DATE',
                'null' => false,
            ],
            'inspection_type' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => false,
            ],
            'authority' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => false,
            ],
            'basis' => [
                'type' => 'VARCHAR',
                'constraint' => 500,
                'null' => true,
            ],
            'status' => [
                'type' => 'VARCHAR',
                'constraint' => 50,
                'default' => 'planned',
                'null' => false,
            ],
            'comment' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'deleted_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addKey('sme_id');
        $this->forge->addKey('planned_date');
        $this->forge->addKey('status');
        $this->forge->addForeignKey('sme_id', 'smes', 'id', 'CASCADE', 'RESTRICT');

        $this->forge->createTable('inspections');
    }

    public function down(): void
    {
        $this->forge->dropTable('inspections');
    }
}