<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\SmeModel;
use CodeIgniter\HTTP\ResponseInterface;

class SmeController extends BaseController
{
    public function index(): ResponseInterface
    {
        $q = trim((string) $this->request->getGet('q'));

        $model = new SmeModel();

        if ($q !== '') {
            $model
                ->groupStart()
                ->like('name', $q, 'both', null, true)
                ->orLike('inn', $q, 'both', null, true)
                ->groupEnd();
        }

        $items = $model
            ->orderBy('name', 'ASC')
            ->limit(20)
            ->find();

        return $this->response->setJSON([
            'items' => $items,
        ]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'message' => 'Некорректное тело запроса',
                ]);
        }

        $payload = $this->normalizePayload($data);

        $validation = service('validation');
        $validation->setRules($this->rules());

        if (!$validation->run($payload)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'errors' => $validation->getErrors(),
                ]);
        }

        $model = new SmeModel();

        $existing = $model->where('inn', $payload['inn'])->first();

        if ($existing) {
            return $this->response->setJSON([
                'id' => (int) $existing['id'],
                'item' => $existing,
                'created' => false,
            ]);
        }

        $id = $model->insert($payload, true);

        return $this->response
            ->setStatusCode(201)
            ->setJSON([
                'id' => (int) $id,
                'item' => $model->find($id),
                'created' => true,
            ]);
    }

    public function update(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'message' => 'Некорректное тело запроса',
                ]);
        }

        $model = new SmeModel();

        $item = $model->find($id);

        if (!$item) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON([
                    'message' => 'СМП не найдено',
                ]);
        }

        $payload = $this->normalizePayload($data);

        $validation = service('validation');
        $validation->setRules($this->rules());

        if (!$validation->run($payload)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'errors' => $validation->getErrors(),
                ]);
        }

        $existingByInn = $model
            ->where('inn', $payload['inn'])
            ->where('id !=', $id)
            ->first();

        if ($existingByInn) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON([
                    'errors' => [
                        'inn' => 'СМП с таким ИНН уже существует',
                    ],
                ]);
        }

        $model->update($id, $payload);

        return $this->response->setJSON([
            'success' => true,
            'id' => $id,
            'item' => $model->find($id),
        ]);
    }

    private function normalizePayload(array $data): array
    {
        return [
            'inn' => trim((string) ($data['inn'] ?? '')),
            'name' => trim((string) ($data['name'] ?? '')),
            'address' => trim((string) ($data['address'] ?? '')),
        ];
    }

    private function rules(): array
    {
        return [
            'inn' => 'required|min_length[5]|max_length[50]',
            'name' => 'required|min_length[2]|max_length[255]',
            'address' => 'permit_empty|max_length[500]',
        ];
    }
}