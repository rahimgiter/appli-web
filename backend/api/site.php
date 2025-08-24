<?php
header("Content-Type: application/json");
$conn = new mysqli("localhost", "root", "", "reseau");

$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'],'/'));
$expand = isset($_GET['_expand']) ? $_GET['_expand'] : null;

try {
    $conn = new PDO("mysql:host=localhost;dbname=reseau", "root", "");
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    switch ($method) {
        case 'GET':
            $sql = "SELECT s.*";
            $expands = $expand ? explode(',', $expand) : [];
            
            if (in_array('localite', $expands)) {
                $sql .= ", l.nom_localite as localite_nom, l.latitude as localite_lat, l.longitude as localite_lon";
            }
            if (in_array('operateur', $expands)) {
                $sql .= ", o.nom_operateur as operateur_nom";
            }
            if (in_array('type_site', $expands)) {
                $sql .= ", t.libelle_type as type_site_libelle";
            }
            if (in_array('trimestre', $expands)) {
                $sql .= ", tr.libelle_trimestre as trimestre_libelle";
            }
            
            $sql .= " FROM site s";
            
            if (in_array('localite', $expands)) {
                $sql .= " LEFT JOIN localite l ON s.id_localite = l.id_localite";
            }
            if (in_array('operateur', $expands)) {
                $sql .= " LEFT JOIN operateur o ON s.id_operateur = o.id_operateur";
            }
            if (in_array('type_site', $expands)) {
                $sql .= " LEFT JOIN type_site t ON s.id_type_site = t.id_type_site";
            }
            if (in_array('trimestre', $expands)) {
                $sql .= " LEFT JOIN trimestre tr ON s.id_trimestre = tr.id_trimestre";
            }
            
            $stmt = $pdo->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formatage pour _expand
            foreach ($results as &$result) {
                if (in_array('localite', $expands)) {
                    $result['localite'] = $result['localite_nom'] ? [
                        'id_localite' => $result['id_localite'],
                        'nom_localite' => $result['localite_nom'],
                        'latitude' => $result['localite_lat'],
                        'longitude' => $result['localite_lon']
                    ] : null;
                }
                if (in_array('operateur', $expands)) {
                    $result['operateur'] = $result['operateur_nom'] ? [
                        'id_operateur' => $result['id_operateur'],
                        'nom_operateur' => $result['operateur_nom']
                    ] : null;
                }
                if (in_array('type_site', $expands)) {
                    $result['type_site'] = $result['type_site_libelle'] ? [
                        'id_type_site' => $result['id_type_site'],
                        'libelle_type' => $result['type_site_libelle']
                    ] : null;
                }
                if (in_array('trimestre', $expands)) {
                    $result['trimestre'] = $result['trimestre_libelle'] ? [
                        'id_trimestre' => $result['id_trimestre'],
                        'libelle_trimestre' => $result['trimestre_libelle']
                    ] : null;
                }
            }
            
            echo json_encode($results);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO site (nom_site, latitude_site, longitude_site, id_localite, id_operateur, id_type_site, annee_site, id_trimestre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['nom_site'],
                $data['latitude_site'],
                $data['longitude_site'],
                $data['id_localite'] ?: null,
                $data['id_operateur'] ?: null,
                $data['id_type_site'],
                $data['annee_site'],
                $data['id_trimestre']
            ]);
            echo json_encode(['id' => $pdo->lastInsertId()]);
            break;
            
        case 'PUT':
            $id = $request[0];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE site SET nom_site = ?, latitude_site = ?, longitude_site = ?, id_localite = ?, id_operateur = ?, id_type_site = ?, annee_site = ?, id_trimestre = ? WHERE id_site = ?");
            $stmt->execute([
                $data['nom_site'],
                $data['latitude_site'],
                $data['longitude_site'],
                $data['id_localite'] ?: null,
                $data['id_operateur'] ?: null,
                $data['id_type_site'],
                $data['annee_site'],
                $data['id_trimestre'],
                $id
            ]);
            echo json_encode(['success' => true]);
            break;
            
        case 'DELETE':
            $id = $request[0];
            $stmt = $pdo->prepare("DELETE FROM site WHERE id_site = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}