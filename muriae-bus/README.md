# Muriaé em Rota

Projeto integrador: aplicativo comunitário para a população de Muriaé (MG) acompanhar os ônibus urbanos em tempo real, consultar horários e reservar poltronas de viagens na rodoviária.

## Problema
- Horários do ônibus urbano estão espalhados em sites de terceiros (Guia Muriaé, onibus.online).
- Quem depende do ônibus (idosos, estudantes, pessoas com deficiência) não sabe quando o próximo passa.
- Informações da rodoviária exigem ir ao guichê ou ligar para cada empresa.

## Público
Usuários do transporte coletivo, com atenção a idosos, estudantes e pessoas com deficiência. Parceiros: Demuttran, Viação União (concessionária do transporte urbano), empresas da rodoviária, prefeitura, IF Sudeste MG.

## Fases
| Fase | Entrega | Depende de terceiros? |
|---|---|---|
| 1 | Linhas, pontos e horários do urbano, com busca | Dados do Demuttran / Viação União (planilha ou GTFS) |
| 2 | Posição dos ônibus em tempo real | GPS nos veículos ou app no celular do motorista, com autorização da concessionária |
| 3 | Reserva de poltronas na rodoviária | Acordo com cada empresa; pagamento fora do escopo inicial |

## O que o protótipo já mostra
Arquivos: `index.html`, `assets/css/app.css`, `assets/js/app.js`.
- Mapa grande que segue o ônibus escolhido, uma linha por vez (ou "Ver tudo"), com ônibus em 3D que gira conforme o trajeto, zoom e botão "A+" de letras maiores para idosos. As ruas são esquemáticas; falta trocar pelas ruas reais do OpenStreetMap.
- Reserva com calendário: escolhe a cidade, vê no mês os dias com viagem, poucas vagas, lotado e sem viagem.
- Carteira: perfil (comum, estudante, idoso 65+, funcionário), passe com saldo, recarga por Pix ou cartão, vale-transporte do empregador e "Embarcar com NFC" (leitura simulada, com QR code como alternativa).
- Conta e perfil: tela de entrada (celular com código por SMS simulado, criar conta ou visitante; sem Google nem gov.br de propósito), sem senha. Perfil com avatar, dados, passe, resumo de uso, linhas favoritas, preferências (letras maiores, sons, tema) e privacidade (ver, copiar e apagar os dados). Visitantes veem mapa e horários; Passe e reservas pedem conta.
- Pagamento da passagem: Pix, cartão de exemplo ou pagar no guichê.
- Responsivo: celular (retrato e deitado), tablet e computador. No computador a navegação vai para o topo e o mapa fica ao lado do painel, com zoom por roda do mouse ou pinça.
- Visual inspirado em apps de corrida (verde-água, cartões, tela de abertura escura).
- Mapa esquemático com 4 linhas de exemplo e 8 ônibus se movendo (posição simulada).
- Próxima parada e minutos para chegar, ocupação e acessibilidade por veículo.
- Tabela de horários por linha, tipo de dia e sentido.
- Fluxo de reserva na rodoviária: destino, data, horário, poltrona, dados do passageiro e código da reserva.

## NFC e pagamento: o que muda na versão real
- O navegador não faz o celular funcionar como cartão de ônibus. Precisa de app Android nativo ou carteira do celular; no iPhone é mais restrito. Alternativa mais simples: QR code que muda a cada poucos segundos.
- Login de verdade (SMS, Google, gov.br) exige provedores contratados; gov.br precisa de cadastro como serviço. No protótipo só existe o SMS simulado. Os dados pessoais exigem base legal, consentimento e termos conforme a LGPD.
- O ônibus precisa de validador. A prefeitura ou a escola precisam confirmar as carteirinhas.
- Pix e cartão exigem banco ou provedor de pagamento, e o saldo precisa ser repassado à empresa de ônibus.

## O que é simulado (precisa ser substituído por dados reais)
- Linhas, paradas e horários do urbano são exemplos. Nomes de bairros são reais, o traçado não.
- Posição dos ônibus, ocupação e acessibilidade são geradas pelo protótipo.
- Destinos, horários, plataformas e poltronas ocupadas da rodoviária são exemplos. As empresas não existem.
- Nenhuma reserva é enviada a lugar nenhum. Nenhuma passagem real é emitida.

## Perguntas para a primeira conversa (Demuttran e Viação União)
1. Existe tabela oficial de linhas, pontos e horários em formato digital (planilha, PDF, GTFS)?
2. Os ônibus têm rastreador GPS? A empresa pode liberar a posição para o app?
3. Se não houver GPS, a concessionária aceitaria um app simples no celular do motorista em uma ou duas linhas-piloto?
4. Quais veículos têm rampa ou elevador?
5. Quem autoriza o uso dos dados e com qual contato?

## Perguntas para a rodoviária
1. Cada empresa tem sistema próprio de venda? Existe API ou planilha de horários?
2. Reserva sem pagamento é permitida? Qual o prazo para retirar ou pagar?
3. Quem seria o responsável por confirmar reservas?

## Riscos
- Sem a concessionária liberando dados, o tempo real não sai. Plano B: posição colaborativa dos passageiros, menos precisa.
- Reserva e venda de passagens dependem de acordos comerciais. Plano B: mostrar horários e destinos com link para a empresa.
- Dados pessoais de passageiros exigem cuidado com LGPD. O protótipo guarda só nome e últimos 4 dígitos do celular, no navegador.

## Próximos passos
1. Conversar com o Demuttran e coletar a tabela de horários.
2. Trocar os dados de exemplo por dados reais das linhas.
3. Testar o app do motorista em uma linha-piloto.
4. Validar com 8 a 15 usuários (idosos, estudantes, pessoas com deficiência) e medir uso.

## Publicar no GitHub Pages
1. Crie o repositório público e envie os arquivos desta pasta (a raiz é o site).
2. Em Settings > Pages, escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. Em Settings > Code security, ative o aviso privado de vulnerabilidades e o Dependabot.
4. Compartilhe o link `https://SEU-USUARIO.github.io/NOME-DO-REPO/` e peça para usarem **dados inventados**.

Leia `SECURITY.md` para as proteções aplicadas e os limites do GitHub Pages. O comando `bash scripts/verificar.sh` (e o GitHub Actions) confere CSP, scripts embutidos, links externos e segredos.

## Estrutura da pasta
```
muriae-bus/
├── index.html            página + política de segurança (CSP)
├── 404.html
├── favicon.svg
├── assets/
│   ├── css/app.css
│   ├── js/app.js
│   └── fonts/            fontes hospedadas aqui (licença OFL em licencas/)
├── scripts/verificar.sh  checagem de segurança
├── .github/workflows/    roda a checagem a cada envio
├── SECURITY.md  LICENSE  README.md
```
