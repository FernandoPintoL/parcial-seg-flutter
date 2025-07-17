#!/bin/bash

# Script para probar la creación de pizarras y detectar el problema

echo "=== Prueba de creación de pizarra ==="
echo "Fecha: $(date)"
echo "Usuario: Simulando usuario ID 2"
echo

# Simular la creación de una pizarra
echo "1. Creando pizarra..."
curl -X POST "http://localhost:8000/pizarra" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name": "Test Pizarra", "isHome": true}' \
  -b "laravel_session=test_session" \
  --verbose

echo -e "\n\n2. Verificando logs..."
tail -n 20 storage/logs/laravel.log | grep -i "pizarra\|error\|collaborator"

echo -e "\n\n3. Verificando base de datos..."
echo "Pizarras creadas recientemente:"
php artisan tinker --execute="
\$pizarras = App\Models\Pizarra::orderBy('created_at', 'desc')->limit(5)->get();
foreach (\$pizarras as \$p) {
    echo 'ID: ' . \$p->id . ', Nombre: ' . \$p->name . ', Usuario: ' . \$p->user_id . ', Creado: ' . \$p->created_at . PHP_EOL;
}
"

echo -e "\nColaboradores creados recientemente:"
php artisan tinker --execute="
\$collaborators = App\Models\PizarraCollaborator::orderBy('created_at', 'desc')->limit(5)->get();
foreach (\$collaborators as \$c) {
    echo 'ID: ' . \$c->id . ', Pizarra: ' . \$c->pizarra_id . ', Usuario: ' . \$c->user_id . ', Estado: ' . \$c->status . ', Creado: ' . \$c->created_at . PHP_EOL;
}
"

echo -e "\n=== Fin de la prueba ==="
