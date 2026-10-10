#!/usr/bin/env bash
# Confere regras de segurança do site estático. Uso: bash scripts/verificar.sh
set -u
cd "$(dirname "$0")/.."
erro=0
falha() { echo "FALHA: $1"; erro=1; }

grep -q "Content-Security-Policy" index.html || falha "index.html sem CSP"
grep -Eq "script-src 'self'" index.html || falha "CSP sem script-src 'self'"
grep -Eiq "unsafe-eval|script-src[^;]*unsafe-inline" index.html && falha "CSP permite script inseguro"

# sem script ou estilo embutido
for f in index.html 404.html; do
  if grep -Ei "<script" "$f" | grep -Eiv "src=" | grep -q .; then falha "$f tem <script> embutido"; fi
  grep -Eiq "<style|\son[a-z]+=\"" "$f" && falha "$f tem <style> ou manipulador onclick embutido"
done

# nenhum endereço externo carregado
if grep -RInE "https?://" index.html 404.html assets --include=*.html --include=*.css --include=*.js | grep -v "www.w3.org" | grep -q .; then
  grep -RInE "https?://" index.html 404.html assets --include=*.html --include=*.css --include=*.js | grep -v "www.w3.org"
  falha "há URL externa no código"
fi

# funções perigosas
if grep -nE "\beval\(|new Function|document\.write|insertAdjacentHTML|outerHTML|fetch\(|XMLHttpRequest|WebSocket|postMessage" assets/js/app.js | grep -q .; then
  grep -nE "\beval\(|new Function|document\.write|insertAdjacentHTML|outerHTML|fetch\(|XMLHttpRequest|WebSocket|postMessage" assets/js/app.js
  falha "função perigosa ou de rede em app.js"
fi

# segredos
if grep -RInEi "(api[_-]?key|secret|token|passw(or)?d|senha)\s*[:=]\s*['\"][^'\"]{6,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{30,}|[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[a-z]{2,}" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=licencas --exclude=verificar.sh --exclude=*.woff2 | grep -q .; then
  grep -RInEi "(api[_-]?key|secret|token|passw(or)?d|senha)\s*[:=]\s*['\"][^'\"]{6,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{30,}|[A-Za-z0-9._-]+@[A-Za-z0-9-]+\.[a-z]{2,}" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=licencas --exclude=verificar.sh --exclude=*.woff2
  falha "possível segredo ou e-mail no repositório"
fi

[ $erro -eq 0 ] && echo "OK: verificações de segurança passaram."
exit $erro
