# Segurança

Este é um protótipo acadêmico que roda inteiro no navegador. Não tem servidor, banco de dados, chaves nem integrações reais.

## O que o protótipo faz e não faz
- Todos os dados (linhas, ônibus, viagens, SMS, pagamento, NFC) são simulados.
- Conta, passe e reservas ficam só no `localStorage` do aparelho de quem testa. Nada é enviado para a internet.
- Não há login com Google ou gov.br, de propósito: uma tela falsa dessas marcas numa página pública pareceria golpe.
- **Testadores: use nome, celular e carteirinha inventados.** Não digite CPF, senhas nem documentos reais.

## Proteções aplicadas
- Política de segurança de conteúdo (CSP) no `index.html`: só roda script do próprio site, não faz nenhuma conexão externa, não aceita iframe, formulário nem `<base>` de fora.
- Sem scripts ou estilos embutidos; fontes hospedadas no próprio repositório (nenhum pedido ao Google Fonts).
- Todo texto digitado entra na tela como texto (`textContent`), nunca como HTML.
- Dados salvos no navegador são validados ao carregar (tipo, tamanho e valores permitidos).
- Proteção contra ser aberto dentro de iframe de outro site.
- `no-referrer` e `noindex`: o link não vaza origem e o site não aparece em buscadores.
- O GitHub Actions confere a cada envio se alguém colocou script de fora, link externo ou segredo.

## Limite do GitHub Pages
O GitHub Pages não permite definir cabeçalhos HTTP, então a CSP vai por `<meta>`. Ela não consegue aplicar `frame-ancestors`; por isso existe a proteção em JavaScript contra iframe. Para o cabeçalho completo (HSTS, X-Frame-Options, Permissions-Policy), a versão de produção deveria ficar atrás de Cloudflare, Netlify ou servidor próprio.

## Antes de virar produto real
Login com SMS e provedores de identidade reais, backend com validação no servidor, HTTPS com cabeçalhos, política de privacidade conforme a LGPD, pagamento por provedor autorizado e revisão de segurança.

## Encontrou um problema?
Abra uma issue sem dados pessoais ou use o aviso privado de vulnerabilidade do GitHub (aba Security do repositório).
