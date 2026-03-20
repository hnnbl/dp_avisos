<?php
// =============================================
//  DP NEWS — API backend
//  Armazena avisos em avisos.json (mesmo diretório)
// =============================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$ARQUIVO = __DIR__ . '/avisos.json';

// --- Helpers ---
function lerAvisos($arquivo) {
    if (!file_exists($arquivo)) return [];
    $raw = file_get_contents($arquivo);
    return json_decode($raw, true) ?: [];
}

function salvarAvisos($arquivo, $avisos) {
    file_put_contents($arquivo, json_encode(array_values($avisos), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function erro($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'erro' => $msg]);
    exit;
}

// Lê body JSON
$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $body['action'] ?? '';

// --- Roteamento ---
switch ($action) {

    // Lista todos os avisos (ordenação feita no front)
    case 'list':
        echo json_encode(lerAvisos($ARQUIVO));
        break;

    // Cria novo aviso
    case 'save':
        $titulo    = trim($body['titulo']    ?? '');
        $descricao = trim($body['descricao'] ?? '');
        $data      = trim($body['data']      ?? '');
        if (!$titulo || !$data) erro('Título e data são obrigatórios.');

        $avisos  = lerAvisos($ARQUIVO);
        $aviso   = [
            'id'           => (int)(microtime(true) * 1000),
            'titulo'       => $titulo,
            'descricao'    => $descricao,
            'data'         => $data,
            'dataValidade' => trim($body['dataValidade'] ?? ''),
            'horaValidade' => trim($body['horaValidade'] ?? ''),
            'urgente'      => !empty($body['urgente']),
            'criadoEm'     => date('c'),
        ];
        $avisos[] = $aviso;
        salvarAvisos($ARQUIVO, $avisos);
        echo json_encode(['ok' => true, 'aviso' => $aviso]);
        break;

    // Atualiza aviso existente
    case 'update':
        $id = $body['id'] ?? null;
        if (!$id) erro('ID não informado.');

        $avisos  = lerAvisos($ARQUIVO);
        $achado  = false;
        foreach ($avisos as &$a) {
            if ((string)$a['id'] === (string)$id) {
                $a['titulo']       = trim($body['titulo']       ?? $a['titulo']);
                $a['descricao']    = trim($body['descricao']    ?? $a['descricao']);
                $a['data']         = trim($body['data']         ?? $a['data']);
                $a['dataValidade'] = trim($body['dataValidade'] ?? '');
                $a['horaValidade'] = trim($body['horaValidade'] ?? '');
                $a['urgente']      = !empty($body['urgente']);
                $a['editadoEm']    = date('c');
                $achado = true;
                break;
            }
        }
        if (!$achado) erro('Aviso não encontrado.', 404);
        salvarAvisos($ARQUIVO, $avisos);
        echo json_encode(['ok' => true]);
        break;

    // Exclui aviso
    case 'delete':
        $id = $body['id'] ?? null;
        if (!$id) erro('ID não informado.');

        $avisos  = lerAvisos($ARQUIVO);
        $filtrado = array_filter($avisos, fn($a) => (string)$a['id'] !== (string)$id);
        if (count($filtrado) === count($avisos)) erro('Aviso não encontrado.', 404);
        salvarAvisos($ARQUIVO, $filtrado);
        echo json_encode(['ok' => true]);
        break;

    default:
        erro('Ação inválida.');
}
