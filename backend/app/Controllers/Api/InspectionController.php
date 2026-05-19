<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\InspectionModel;
use App\Models\SmeModel;
use CodeIgniter\HTTP\ResponseInterface;

class InspectionController extends BaseController
{
    public function index(): ResponseInterface
    {
        $q = trim((string) $this->request->getGet('q'));
        $dateFrom = $this->request->getGet('date_from');
        $dateTo = $this->request->getGet('date_to');
        $status = $this->request->getGet('status');

        $page = max(1, (int) $this->request->getGet('page'));
        $perPage = min(100, max(1, (int) ($this->request->getGet('per_page') ?? 20)));

        $builder = $this->baseQuery();

        if ($q !== '') {
            $builder
                ->groupStart()
                ->like('s.name', $q, 'both', null, true)
                ->orLike('s.inn', $q, 'both', null, true)
                ->orLike('i.authority', $q, 'both', null, true)
                ->orLike('i.inspection_type', $q, 'both', null, true)
                ->groupEnd();
        }

        if ($dateFrom) {
            $builder->where('i.planned_date >=', $dateFrom);
        }

        if ($dateTo) {
            $builder->where('i.planned_date <=', $dateTo);
        }

        if ($status) {
            $builder->where('i.status', $status);
        }

        $countBuilder = clone $builder;
        $total = $countBuilder->countAllResults();

        $items = $builder
            ->orderBy('i.planned_date', 'DESC')
            ->orderBy('i.id', 'DESC')
            ->limit($perPage, ($page - 1) * $perPage)
            ->get()
            ->getResultArray();

        return $this->response->setJSON([
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
    }

    public function show(int $id): ResponseInterface
    {
        $item = $this->baseQuery()
            ->where('i.id', $id)
            ->get()
            ->getRowArray();

        if (!$item) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Проверка не найдена']);
        }

        return $this->response->setJSON($item);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['message' => 'Некорректное тело запроса']);
        }

        $validation = service('validation');
        $validation->setRules($this->rules());

        if (!$validation->run($data)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON(['errors' => $validation->getErrors()]);
        }

        $model = new InspectionModel();
        $id = $model->insert($data, true);

        return $this->response
            ->setStatusCode(201)
            ->setJSON(['id' => $id]);
    }

    public function update(int $id): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (!is_array($data)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['message' => 'Некорректное тело запроса']);
        }

        $model = new InspectionModel();

        if (!$model->find($id)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Проверка не найдена']);
        }

        $validation = service('validation');
        $validation->setRules($this->rules());

        if (!$validation->run($data)) {
            return $this->response
                ->setStatusCode(422)
                ->setJSON(['errors' => $validation->getErrors()]);
        }

        $model->update($id, $data);

        return $this->response->setJSON(['success' => true]);
    }

    public function delete(int $id): ResponseInterface
    {
        $model = new InspectionModel();

        if (!$model->find($id)) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['message' => 'Проверка не найдена']);
        }

        $model->delete($id);

        return $this->response->setJSON(['success' => true]);
    }

    public function export(): ResponseInterface
    {
        $items = $this->baseQuery()
            ->orderBy('i.planned_date', 'DESC')
            ->orderBy('i.id', 'DESC')
            ->get()
            ->getResultArray();

        $handle = fopen('php://temp', 'rb+');

        fputcsv($handle, [
            'id',
            'sme_id',
            'sme_inn',
            'sme_name',
            'sme_address',
            'planned_date',
            'inspection_type',
            'authority',
            'basis',
            'status',
            'comment',
        ]);

        foreach ($items as $item) {
            fputcsv($handle, [
                $item['id'] ?? '',
                $item['sme_id'] ?? '',
                $item['sme_inn'] ?? '',
                $item['sme_name'] ?? '',
                $item['sme_address'] ?? '',
                $item['planned_date'] ?? '',
                $item['inspection_type'] ?? '',
                $item['authority'] ?? '',
                $item['basis'] ?? '',
                $item['status'] ?? '',
                $item['comment'] ?? '',
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $this->response
            ->setHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->setHeader('Content-Disposition', 'attachment; filename="inspections.csv"')
            ->setBody($csv);
    }

    public function import(): ResponseInterface
    {
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'message' => 'Файл не загружен',
                ]);
        }

        $path = $file->getTempName();
        $handle = fopen($path, 'rb');

        if (!$handle) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'message' => 'Не удалось открыть файл',
                ]);
        }

        $smeModel = new SmeModel();
        $inspectionModel = new InspectionModel();

        $header = fgetcsv($handle);

        if (!$header) {
            fclose($handle);

            return $this->response
                ->setStatusCode(400)
                ->setJSON([
                    'message' => 'CSV-файл пустой',
                ]);
        }

        $created = 0;
        $skipped = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            $data = array_combine($header, $row);

            if (!is_array($data)) {
                $skipped++;
                continue;
            }

            $inn = trim((string) ($data['sme_inn'] ?? ''));
            $name = trim((string) ($data['sme_name'] ?? ''));
            $address = trim((string) ($data['sme_address'] ?? ''));

            $plannedDate = trim((string) ($data['planned_date'] ?? ''));
            $inspectionType = trim((string) ($data['inspection_type'] ?? ''));
            $authority = trim((string) ($data['authority'] ?? ''));
            $basis = trim((string) ($data['basis'] ?? ''));
            $status = trim((string) ($data['status'] ?? 'planned'));
            $comment = trim((string) ($data['comment'] ?? ''));

            if ($inn === '' || $name === '' || $plannedDate === '' || $inspectionType === '' || $authority === '') {
                $skipped++;
                $errors[] = 'Пропущена строка: не заполнены обязательные поля';
                continue;
            }

            $sme = $smeModel->where('inn', $inn)->first();

            if (!$sme) {
                $smeId = $smeModel->insert([
                    'inn' => $inn,
                    'name' => $name,
                    'address' => $address,
                ], true);
            } else {
                $smeId = $sme['id'];
            }

            $inspectionData = [
                'sme_id' => $smeId,
                'planned_date' => $plannedDate,
                'inspection_type' => $inspectionType,
                'authority' => $authority,
                'basis' => $basis,
                'status' => in_array($status, ['planned', 'completed', 'cancelled'], true) ? $status : 'planned',
                'comment' => $comment,
            ];

            $inspectionModel->insert($inspectionData);
            $created++;
        }

        fclose($handle);

        return $this->response->setJSON([
            'success' => true,
            'created' => $created,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    private function baseQuery()
    {
        return db_connect()
            ->table('inspections i')
            ->select('
            i.id,
            i.sme_id,
            i.planned_date,
            i.inspection_type,
            i.authority,
            i.basis,
            i.status,
            i.comment,
            s.inn AS sme_inn,
            s.name AS sme_name,
            s.address AS sme_address
        ')
            ->join('smes s', 's.id = i.sme_id')
            ->where('i.deleted_at', null);
    }

    private function rules(): array
    {
        return [
            'sme_id' => 'required|integer|is_not_unique[smes.id]',
            'planned_date' => 'required|valid_date[Y-m-d]',
            'inspection_type' => 'required|min_length[2]|max_length[255]',
            'authority' => 'required|min_length[2]|max_length[255]',
            'basis' => 'permit_empty|max_length[500]',
            'status' => 'required|in_list[planned,completed,cancelled]',
            'comment' => 'permit_empty',
        ];
    }
}