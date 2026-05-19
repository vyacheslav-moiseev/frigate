<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSmesTable extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id' => [
                'type' => 'INT',
                'auto_increment' => true,
            ],
            'inn' => [
                'type' => 'VARCHAR',
                'constraint' => 20,
                'null' => false,
            ],
            'name' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => false,
            ],
            'address' => [
                'type' => 'VARCHAR',
                'constraint' => 500,
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
        ]);

        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('inn');
        $this->forge->addKey('name');

        $this->forge->createTable('smes');
    }

    public function down(): void
    {
        $this->forge->dropTable('smes');
    }
}