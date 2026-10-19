# Kurio — marketplace de NFTs

Desafio de front-end da Jungle Gaming. Um app React para descobrir, favoritar e comprar NFTs, com versões desktop e mobile.
Não há backend real: o **MSW** simula toda a API (REST e Socket.IO), em desenvolvimento, nos testes e no site publicado.

| | |
| --- | --- |
| **Site publicado** | https://jungle-gaming-challenge.pages.dev |
| **Rodar localmente** | `pnpm install` e `pnpm dev` (http://localhost:5173) |
| **Conta de teste** | `ana@kurio.test` / `Colecionar#2026` |
| **Verificar tudo** | `pnpm verify` e `pnpm test:e2e` |

## Resumo

- **Entregue:** catálogo com busca, filtros, ordenação e paginação; detalhe do NFT; favoritos; carrinho; checkout com carteiras, cupons e recibo; conta, perfil e carteiras; atualizações em tempo real (Socket.IO) de preço, disponibilidade e pedido.
- **Qualidade:** 169 testes unitários e mais de 280 testes E2E (Playwright, desktop 1440 e mobile 390). Cada requisito marcado como feito tem um teste que o nomeia ([`docs/spec/traceability.md`](docs/spec/traceability.md)).
- **Lighthouse** (site publicado, mediana de 3 rodadas): acessibilidade, boas práticas e SEO em 100 em todas as páginas; desempenho 99 no desktop. **No mobile o desempenho é 82 (home) e 80 (detalhe), abaixo da meta de 90**: a primeira pintura espera o JavaScript do app (cerca de 250 KB comprimidos) chegar e rodar; o backend simulado carrega depois, e os dados e a imagem do detalhe esperam por ele. O relatório com as causas e o que foi testado está em [`reports/lighthouse/`](reports/lighthouse/README.md).
- **Publicação:** só o pipeline do GitHub Actions publica em produção, e só depois de a verificação, o E2E no build e o E2E na cópia de teste passarem. Depois da promoção, um smoke test confere a produção.

**O que não funciona:** veja [Limitações](#limitações) logo abaixo. Está tudo listado, inclusive o que pode parecer defeito mas é regra de negócio.

## Limitações

### Fora do escopo do desafio (não funciona, de propósito)
O enunciado deixa fora blockchain, extensões de carteira e pagamentos reais, e as páginas editoriais, de suporte, atividade, ofertas e downloads. Na tela, esses controles aparecem como no Figma, mas não simulam sucesso: ficam desativados ou respondem "Em breve".

| Onde | O que acontece |
| --- | --- |
| Cabeçalho: **Criadores** e **Aprenda** | Mostram "Em breve". (**Mercado** funciona: leva ao catálogo.) |
| Login: **Esqueceu a senha?**, **Continuar com Google/Facebook** | Desativados |
| Conta: **Atividade**, **Lista de interesse**, **Ofertas**, **Arquivos baixados**, **Suporte** | Itens do menu inativos; só **Dados do perfil** e **Carteiras** abrem |
| Detalhe: aba **Avaliações de colecionadores** | Inativa (só o rótulo, como no Figma) |
| Página inicial: cards do **blog** | Mostram "Em breve" |
| Rodapé: **newsletter**, colunas de links, ícones de redes sociais | Formulário desativado; links e ícones são só texto |
| Recibo: **Ver no Etherscan** | Desativado (a transação é simulada) |
| Carteiras (MetaMask, WalletConnect, Coinbase) | Conexão simulada; nenhuma extensão real é usada |

Compartilhar no detalhe (LinkedIn, e-mail, Twitter) abre os sites reais com o link da página.

### Consequências do backend simulado
- **Precisa de service worker.** Todo o backend roda no navegador (MSW). Onde o navegador bloqueia service workers (navegação privada do Firefox, alguns navegadores dentro de apps, políticas corporativas), os dados não carregam: o catálogo mostra "Não foi possível carregar os NFTs.". Use Chrome, Edge ou Firefox em janela normal.
- **Os dados ficam no seu navegador** (`localStorage`). Outro navegador ou aparelho não vê o mesmo carrinho, favoritos ou pedidos. Limpar os dados do site, ou usar `?reset=1`, volta tudo ao estado inicial.
- **O tempo real é gerado pelo próprio mock** (cenários e painel Demo), não por outros usuários.
- **Valores inventados:** as taxas de Polygon e Solana; o código de indicação e o endereço Solana são validados só pelo formato; os únicos cupons são `KURIO10`, `LANCAMENTO5` e `EXPIRADO`.

### Regras de negócio que podem parecer defeito
- **Um carrinho por rede.** Adicionar um NFT de outra rede pede para esvaziar o carrinho (a carteira e a taxa são de uma rede só).
- **Quantidade limitada ao estoque da edição.** A edição 1/1 tem uma unidade; 1/10 e 1/50 aceitam mais.
- **O preço do detalhe é unitário.** O total com a quantidade aparece no carrinho.
- **Um pedido pendente por usuário**, para não haver pedido duplicado.
- **O filtro de preço define o máximo.** O mínimo só pela URL (`minPrice`).
- **Visitante** monta o carrinho sem login, mas favoritar e pagar pedem login.

### Metas não atingidas
- **Desempenho no Lighthouse mobile abaixo de 90.** As outras categorias estão em 100 e o desktop em 99, mas no mobile a primeira pintura espera o JavaScript do app (cerca de 250 KB comprimidos) chegar e rodar, e os dados e a imagem do detalhe esperam o backend simulado, que é exigido no site publicado e carrega logo depois. Números, causas e o que foi tentado: [`reports/lighthouse/`](reports/lighthouse/README.md).

### Visual e design
- O Figma usado é uma cópia do original, que não pôde ser lido; a fidelidade ao original não foi conferida.
- Só 4 artes são do Figma; as outras 53 são variações de cor delas ([`docs/assets/derive-artwork.py`](docs/assets/derive-artwork.py)). A galeria do detalhe repete a imagem do NFT.
- Carrinho e detalhe usam o layout de celular até 1023 px (o Figma só tem quadros de 414 e 1440 px).
- Os desvios do Figma estão listados, um a um, no [`ARCHITECTURE.md`](ARCHITECTURE.md) §8.

### Opcionais não feitos
Campos de preço exato no filtro, chips dos filtros ativos, esconder o campo ENS nas redes que não são Ethereum (hoje ele só deixa de ser obrigatório), ícones no lugar das letras do rodapé e a padronização dos textos de marca e contato.

### Testes
- Os testes rodam só no Chromium (desktop 1440 e celular 390, mais larguras de 320 a 1920). Safari e Firefox não são testados.
- A acessibilidade é verificada com axe e testes de teclado; não houve teste manual com leitor de tela.

A interface é em português (pt-BR), como no Figma. Código, comentários e documentação técnica são em inglês.

**Índice:** [Limitações](#limitações) · [Setup](#setup) · [Comandos](#comandos) · [Cenários do mock](#cenários-do-mock) · [Reproduzir os fluxos de falha](#reproduzir-os-fluxos-de-falha) · [Testes](#testes) · [Mais documentação](#mais-documentação)

## Setup

Requisitos: Node 22 e pnpm 10.

```bash
pnpm install
pnpm exec playwright install chromium   # só para os testes E2E
pnpm dev                                # servidor de desenvolvimento com os mocks ligados
```

**Variáveis de ambiente** (copie `.env.example` para `.env`; o repositório já traz os padrões):

| Variável | Padrão | Significado |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Liga o worker do MSW. Fica `true` também no site publicado. Com `false` o app não tem backend |
| `VITE_REALTIME_URL` | `wss://realtime.kurio.mock` | Endereço do servidor Socket.IO. É um host fictício: o MSW o intercepta |

**Credenciais fictícias**

| E-mail | Senha | Observações |
| --- | --- | --- |
| `ana@kurio.test` | `Colecionar#2026` | Duas carteiras salvas (como no quadro de pagamento do Figma) |
| `bruno@kurio.test` | `Colecionar#2027` | Sem carteiras |

Cupons: `KURIO10` (10%), `LANCAMENTO5` (5%), `EXPIRADO` (conhecido, mas expirado). Qualquer outro código é inválido.

## Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento com os mocks |
| `pnpm build` | Gera as rotas, verifica os tipos e compila para `dist/` |
| `pnpm preview` | Serve `dist/` em http://localhost:4173 (rode `pnpm build` antes) |
| `pnpm typecheck` | Geração de rotas e `tsc -b` |
| `pnpm lint` | oxlint |
| `pnpm test:unit` / `pnpm test:coverage` | Vitest; o segundo exige cobertura mínima nas regras de negócio |
| `pnpm test:e2e` | Playwright em Chromium, desktop (1440) e mobile (390); compila e serve o app sozinho |
| `pnpm spec:check` | Confere que todo requisito feito tem teste e que este README lista todos os cenários |
| `pnpm verify` | typecheck, lint, testes unitários com cobertura, build e `spec:check` |
| `pnpm lighthouse` | Auditoria Lighthouse (`--url`, `--runs`, `--out`); veja `scripts/lighthouse.ts` |

Para rodar o E2E contra o site publicado: `BASE_URL=https://jungle-gaming-challenge.pages.dev pnpm test:e2e`.

## Cenários do mock

Todo cenário é determinístico. Escolha um de três jeitos:

1. **URL:** acrescente `?scenario=<nome>` a qualquer página, por exemplo `/?scenario=http-5xx`. O parâmetro é lido uma vez e removido do endereço.
2. **Painel Demo:** a pequena seta na borda esquerda de toda página (nome "Demo"; ao passar o mouse, a dica explica) abre o painel com os cenários.
3. **Console:** `window.__mock.setScenario('<nome>')`.

**Reset:** `?reset=1` (combina com `?scenario=`), ou **Resetar estado** no painel Demo, ou `window.__mock.reset()`.
Isso restaura os dados iniciais (usuários, carteiras, carrinhos, favoritos, pedidos, chaves de idempotência) e limpa o armazenamento local e os eventos na fila. Um cenário continua ativo até você trocá-lo ou fazer o reset.

<details>
<summary>Tabela dos 17 cenários</summary>

<!-- scenarios:start -->
| Requisito | Cenário | Como ativar | O que observar |
| --- | --- | --- | --- |
| `MOCK-S01` | sucesso (padrão) | `?scenario=success` | Tudo funciona: navegar, entrar, adicionar ao carrinho, pagar, recibo |
| `MOCK-S02` | resultado vazio | `?scenario=empty` | O catálogo mostra "Nenhum NFT encontrado com esses filtros." e o botão "Limpar filtros" |
| `MOCK-S03` | latência variável | `?scenario=slow` | Cada chamada espera 1,8 s, 3,2 s, 0,9 s, 2,4 s em sequência; os esqueletos ocupam o espaço e o layout não se move |
| `MOCK-S04` | respostas fora de ordem | `?scenario=out-of-order` | As respostas levam 1,8 s, 0,5 s, 0,1 s em sequência. Troque filtro ou ordem rápido: a tela termina na última escolha e as respostas antigas são descartadas |
| `MOCK-S05` | falha de conexão | `?scenario=offline` | As requisições falham na conexão. O catálogo mostra "Não foi possível carregar os NFTs." com "Tentar novamente"; volte para `success` e tente de novo para recuperar |
| `MOCK-S06` | HTTP 4xx | `?scenario=http-4xx` | Toda chamada responde `400`. A mensagem de erro correspondente aparece, sem laço de repetição |
| `MOCK-S07` | HTTP 5xx | `?scenario=http-5xx` | Toda chamada responde `503`. As leituras são repetidas duas vezes e depois aparece o erro com "Tentar novamente". Um favorito marcado agora é desfeito e a falha é anunciada |
| `MOCK-S08` | sessão expirada | `?scenario=session-expired` | As chamadas privadas respondem `401 session_expired`. O app vai para o login com um aviso e volta ao ponto em que você estava depois de entrar de novo |
| `MOCK-S09` | acesso não autorizado | `?scenario=unauthorized` | As chamadas privadas respondem `403`. A página explica que o acesso não é permitido |
| `MOCK-S10` | conflito no cadastro | `?scenario=signup-conflict` (opcional) | Não precisa trocar de cenário: cadastre-se com `ana@kurio.test` ou o usuário `ana` e o campo mostra "já cadastrado". O nome do cenário só o marca no painel Demo |
| `MOCK-S11` | cupom inválido | `?scenario=coupon-invalid` | No carrinho, todo código é informado como inválido |
| `MOCK-S12` | cupom expirado | `?scenario=coupon-expired` | No carrinho, todo código é informado como expirado |
| `MOCK-S13` | preço muda durante a compra | `?scenario=price-changed` | Adicione um item, abra o pagamento e confirme. Logo antes de o pedido ser criado, o primeiro item sobe 0,1 ETH (uma vez, com um evento `nft.updated`). O novo total precisa ser confirmado; nenhum pedido existe até lá |
| `MOCK-S14` | edição esgota durante a compra | `?scenario=sold-out` | Mesmo momento, mas a edição da primeira linha esgota (uma vez). A cotação lista o problema e o checkout é bloqueado |
| `MOCK-S15` | timeout após criar o pedido | `?scenario=order-timeout` | O pedido é criado mas a resposta se perde. O app reenvia com a mesma `Idempotency-Key` e termina com exatamente um pedido |
| `MOCK-S16` | pagamento confirmado | `?scenario=payment-confirmed` | O resultado padrão: uma tela de pendente e, cerca de 2 s depois, o recibo via `order.updated` |
| `MOCK-S17` | pagamento recusado | `?scenario=payment-refused` | A tela de pendente vira uma recusa; o carrinho é mantido e dá para tentar de novo |
| — | conexão da carteira recusada | `?scenario=wallet-refused` | No pagamento, a conexão com o app de carteira é recusada com uma mensagem e pode ser tentada de novo |
<!-- scenarios:end -->

</details>

Os eventos em tempo real (`nft.updated`, `order.updated`) passam pelo `socket.io-client` de verdade. O `window.__mock` também pode derrubar a conexão, reenviar um evento, enviar uma versão antiga de um NFT ou avançar o relógio do mock; os controles estão em [`src/mocks/control.ts`](src/mocks/control.ts). O transporte e seus limites estão em [`ARCHITECTURE.md`](ARCHITECTURE.md) §5.

## Reproduzir os fluxos de falha

| Fluxo | Passos |
| --- | --- |
| Pagamento recusado e nova tentativa | `/?reset=1&scenario=payment-refused`, entre como Ana, compre um NFT, veja a recusa, mude para `success` e tente de novo |
| Timeout com recuperação | `/?reset=1&scenario=order-timeout`, compre um NFT; o recibo chega e `window.__mock.orders()` é `1` |
| Preço muda durante o checkout | `/?reset=1&scenario=price-changed`, adicione um NFT, confirme o pagamento e aceite o novo total |
| Sessão expira no checkout | Abra o pagamento, rode `window.__mock.advance(31 * 60 * 1000)` e confirme: você volta ao pagamento depois de entrar, com as escolhas mantidas |
| Conexão cai com pedido pendente | Compre um NFT, rode `window.__mock.dropConnections()` e recarregue: o pedido pendente é encontrado e termina confirmado ou recusado |

## Testes

- **Unitários (Vitest):** conta de dinheiro, controle de versão, serviços do mock, regras de sessão.
- **E2E (Playwright):** os fluxos do enunciado (§9) em Chromium, 1440 e 390 de largura. Um requisito só é `done` quando um teste o nomeia (`ID#k` no título); o `pnpm spec:check` garante isso e escreve [`docs/spec/traceability.md`](docs/spec/traceability.md).
- **Relatórios e traces:** cada execução gera um relatório HTML (`playwright-report/`, abra com `pnpm exec playwright show-report`) e guarda o trace de cada teste que falhou em `test-results/` (`pnpm exec playwright show-trace <trace.zip>`). A CI anexa os dois a cada execução por 14 dias.
- **Lighthouse:** 3 rodadas por página e perfil (home e detalhe, mobile e desktop), com HTML e JSON de cada uma, versões das ferramentas e condições, em [`reports/lighthouse/`](reports/lighthouse).

## Mais documentação

- [`ARCHITECTURE.md`](ARCHITECTURE.md): contratos REST e de eventos, política de sessão, estado do carrinho, cache, reconciliação REST e Socket.IO, decisões de UX, desvios do Figma e o pipeline de publicação (§9).
- [`docs/spec`](docs/spec/README.md): requisitos, marcos e rastreabilidade.
- [`docs/ENUNCIADO.md`](docs/ENUNCIADO.md): o enunciado.
