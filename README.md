# Azul360 Content Studio — primeiro marco

MVP interno para criar, revisar e exportar artes e legendas. Os quatro perfis e os cinco modelos são registros editáveis. O arquivo oficial de logo previamente fornecido para Azul360 está incluído em `public/brand-assets`; os demais perfis dependem de seus arquivos próprios. A geração consulta notícias com fonte e data de publicação; IA externa é opcional. O Google Drive pode listar fotos e materiais da marca após configurar o acesso. Meta, calendário e publicação ainda não estão conectados; a interface mostra isso explicitamente.

## Demonstração visual sem instalação

Abra `demo/index.html` diretamente no navegador para explorar o painel, os quatro perfis, os quatro modelos atualmente em foco, o editor, as prévias e o fluxo de revisão. A demonstração roda sem servidor; os dados ficam no armazenamento local do navegador, e o botão de download gera um PNG ilustrativo. Este HTML é um protótipo de navegação separado do aplicativo Next.js: não usa autenticação ou PostgreSQL, não envia arquivos ao servidor e não publica nem agenda. Para executar o MVP com login, histórico e exportação pelo servidor, siga as instruções abaixo.

## Requisitos

- Node.js 20 ou superior; Docker com Compose para PostgreSQL.
- Em Linux, o binário Chromium é fornecido pelo pacote instalado no projeto. Em macOS/Windows, instale o Chromium do Playwright.

## Iniciar localmente

```bash
cp .env.example .env
# Troque SESSION_SECRET (32+ caracteres) e SEED_ADMIN_PASSWORD (12+ caracteres)
docker compose up -d
npm ci
npx prisma migrate deploy
npm run db:seed
# macOS/Windows: npx playwright install chromium
npm run dev
```

Abra `http://localhost:3000` e entre com `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. O seed falha de propósito se não houver senha de administrador configurada.

## Fluxo

1. Acesse **Perfis**, edite tom de voz e envie o arquivo da logo oficial. A aplicação usa o arquivo recebido sem redesenhar o símbolo.
2. Vá a **Criar conteúdo**, selecione um perfil e um dos cinco modelos.
3. Informe a pauta; use **Gerar automaticamente**, confira a fonte e as pendências, edite títulos, páginas e legenda.
4. Salve, envie para revisão, aprove ou rejeite. Notícias só podem ser aprovadas com URL da fonte e data.
5. Baixe o PNG da peça avulsa ou o ZIP com os cinco slides dos modelos 2 e 4. O servidor renderiza a composição exibida na prévia, com Playwright.

A prévia em tela representa a composição do template; compare o PNG final na revisão visual. Não aprove nem publique notícias com texto demonstrativo sem substituir por fatos confirmados.

## Geração automática e fotos autorizadas

- O botão **Gerar automaticamente** está disponível nos modelos. **Notícia** e **Conteúdo rico** preenchem cinco slides editáveis e a legenda. O catálogo em `lib/ai/catalog.ts` cadastra **30 portais editoriais distintos**, incluindo veículos especializados em economia e negócios e duas agências com cobertura empresarial. Há no máximo **um canal por marca**, sem repetir Sebrae por unidade regional. Apenas Agência Brasil e Agência Sebrae têm endereços RSS inicialmente definidos; para os demais, a coleta procura no próprio site um link RSS/Atom divulgado em HTML. **Cadastro não equivale a conexão validada.** Se o portal não anunciar feed, bloquear acesso, exigir assinatura ou apresentar erro, fica com status de falha no painel e não é tratado como fonte atualizada. Portais do mesmo grupo podem ter controle societário comum; a lista separa publicações, não prova independência de propriedade. O processo guarda matérias com URL e data no PostgreSQL e exibe a última verificação em **Configurações**. Notícias são selecionadas entre publicações dos últimos sete dias; outras pautas consultam até 90 dias. Cada rascunho traz URL da fonte e data de publicação; não transforma data de publicação em data do acontecimento. Essa última permanece pendente para notícias. Sem matéria verificável recente, a geração retorna erro. Não inventa taxas, critérios ou nomes de linhas. Não faz leitura semântica integral da notícia nem garante relevância: a equipe deve abrir a fonte e revisar cada afirmação. Para sugestões mais desenvolvidas, configure `OPENAI_API_KEY` e `OPENAI_TEXT_MODEL` no servidor; a redação recebe somente título e resumo publicados.
- A **Frase Azul360** usa uma citação previamente conferida e adaptada para português, nome e ocupação do autor. Busca na pasta autorizada do perfil um PNG com “Napoleon Hill” no nome e fundo transparente. Se não encontrar ou não puder importar um retrato autorizado, deixa a foto pendente. Não cria semblantes por IA nem apresenta fotografia de outra pessoa como autor.
- Em **Perfis**, cole o link completo de uma pasta do Google Drive, salve e clique em **Testar acesso às fotos**. Em seguida, no editor, escolha uma foto da pasta ou deixe que a Frase tente selecioná-la pelo nome. O aplicativo baixa a foto verificada para `public/uploads`, registra a origem e só permite imagens da pasta cadastrada. No modelo Frase, exige PNG transparente.
- Cole **separadamente** o link da pasta de **elementos da marca** de cada perfil. Ela pode conter paleta, manuais, logos oficiais, fontes e outros elementos. Salve e clique em **Testar materiais da marca** para listar os arquivos e seus links. Os arquivos não substituem automaticamente o logo, as fontes ou as cores do template: confira os materiais e cadastre as cores no perfil, preservando o modelo Frase aprovado. A listagem lê no máximo 300 arquivos da pasta, sem navegar em subpastas.
- Para uma pasta pública com “qualquer pessoa com o link”, configure `GOOGLE_DRIVE_API_KEY`. Para uma pasta privada, configure `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON` no ambiente do servidor e compartilhe a pasta como **Leitor** com o `client_email` da conta de serviço. Um link sozinho não autoriza a API a listar uma pasta restrita. A configuração de produção deve usar armazenamento persistente para as fotos importadas.

### Coleta diária em produção

Depois de implantar o Next.js com PostgreSQL e executar `npx prisma migrate deploy && npm run db:seed`, configure `CRON_SECRET` (32+ caracteres) no servidor. No repositório GitHub, configure os segredos `AZUL_STUDIO_URL` (URL HTTPS pública da aplicação) e `AZUL_CRON_SECRET` (mesmo valor de `CRON_SECRET`). O workflow `.github/workflows/ingest.yml` chama `POST /api/cron/ingest` diariamente às **09:12 UTC**. O endpoint exige `Authorization: Bearer <CRON_SECRET>` e devolve número de canais consultados e falhas. O agendamento do GitHub só executa no ramo padrão de um repositório publicado, e não inicia enquanto o site não estiver implantado e os segredos não forem definidos. O botão **Gerar automaticamente** também dispara uma coleta quando a última tentativa tiver 24 horas ou mais; a primeira geração pode demorar dezenas de segundos. Não deixe o cron disparar simultaneamente em várias instâncias. A rede do servidor precisa permitir acesso HTTPS aos feeds.

As 30 entradas são **portais candidatos**: apenas dois feeds têm URL previamente informada e os outros dependem da descoberta automática. **O número de fontes efetivamente conectadas é o número de linhas com sucesso após a primeira coleta**, não o número cadastrado. Portais sem RSS/Atom anunciado exigem uma integração específica ou licença de dados; não use scraping indiscriminado ou conteúdo protegido. Se a coleta falhar, o painel mostra o erro. Matérias antigas guardadas no banco ainda podem aparecer dentro da janela de sete/90 dias; confira a data no rascunho.

## Dados e arquitetura

- `User`: usuário interno e função (`ADMIN` ou `EDITOR`).
- `Profile`: identidade editorial, paleta, logo e duas pastas opcionais do Drive (fotos e marca).
- `Template`: cinco tipos iniciais, dimensões e campos configuráveis.
- `Content`: arte, legenda, fonte, foto e estado de revisão.
- `Revision` e `AuditEvent`: versões e histórico de ações.
- `MediaAsset`: arquivo enviado; `Publication`: preparado para a integração futura.
- `PortalSource` e `SourceArticle`: estado dos canais RSS e histórico das matérias com URL única.

Credenciais são somente variáveis de ambiente; sessões usam cookie HttpOnly assinado. O endpoint de upload verifica assinatura básica de PNG, JPEG e WebP, limita a 8 MB e restringe a pasta local de arquivos. Para produção, substitua o armazenamento em `public/uploads` por um serviço persistente e use um volume/bucket com política de acesso definida. O exemplo de Compose usa senha de desenvolvimento; não a reutilize em produção.

## Integrações seguintes

- `lib/ai`: geração de texto mais rica com saída estruturada, recuperação do texto integral das fontes e validação editorial.
- `lib/drive`: armazenamento persistente das imagens importadas, paginação além das primeiras 300 imagens e consentimento por pessoa retratada.
- `lib/meta`: conexão por perfil, verificação de permissões e publicação oficial.
- `lib/publishing`: agendamento com fila, idempotência, tentativas e histórico de erros.

Não existe publicação autônoma no primeiro marco. Não conecte a Meta alterando só a interface: o serviço de publicação precisa implementar autenticação, preparação de mídia e validação de resposta.

## Verificações

```bash
npm run typecheck
npm run test:sources
npm run build
```

## Atualização dos modelos 2 e 4 — referência PSD

Os modelos **Notícia no crédito** e **Conteúdo rico** agora compartilham a estrutura visual de cinco páginas da referência `docs/referencia-carrossel.png`:

| Página | Composição | Campos editáveis |
| --- | --- | --- |
| 1 | Foto inteira, degradê azul inferior, título branco na metade inferior | Título e foto |
| 2 | Fundo branco, texto contextual na parte superior, título grande embaixo com palavra azul | Contexto, título e destaque |
| 3 | Foto inteira, título branco no alto e segundo título embaixo | Dois títulos e foto |
| 4 | Fundo branco, título azul no alto, texto curto embaixo | Título, texto e destaque |
| 5 | Foto inteira mais escura, título branco no alto, CTA curto na parte inferior | Título, CTA e foto |

As fotos de exemplo foram extraídas das camadas fotográficas do PSD fornecido, sem incorporar o texto à imagem. Substitua-as no editor quando o assunto pedir outras fotos. O sistema guarda cinco objetos de slide separados no campo JSON `Content.slides`; edição, prévia e exportação usam o mesmo conteúdo. Cada PNG tem 1080 × 1440, e o ZIP preserva a ordem dos slides.

O projeto inclui os arquivos Gilroy Regular, Medium, SemiBold e Bold em `public/fonts/`, fornecidos pela equipe em TTF. Os modelos carregam Regular (400), SemiBold (600) e Bold (700); o título branco do modelo foto do time usa Regular (400). Preserve esses arquivos no ambiente de produção. A logo azul pequena das páginas brancas foi extraída como camada original do PSD; nas páginas fotográficas, a aplicação usa o arquivo oficial de logo já fornecido. Nenhuma das logos é redesenhada.

Os tamanhos do carrossel são definidos por função em `components/templates/CarouselArtwork.tsx`: chamada de abertura 74 px, títulos principais 110 px, segundo título da página 3 100 px (para caber na largura disponível) e textos de apoio/CTA 26 px. Alterar as variáveis CSS no início de `.carousel-art` atualiza todos os slides correspondentes. Os estilos de peso, entrelinha e posição continuam específicos de cada composição.

### Referências adicionais da Azul360

- `docs/referencia-modelo-frase.png`: referência do **modelo Frase** (1086 × 1448). A base visual proposta em `docs/base-modelo-frase-proposta.png` foi aprovada pela equipe e está em `public/reference/modelo-frase-base.png`. Como sua geração resultou em 1087 × 1447, o editor a dimensiona para a exportação 1080 × 1440; há uma pequena diferença de rasterização em relação ao original. No editor do perfil Azul360, os únicos campos visuais variáveis são foto autorizada, frase, nome e ocupação do autor; o restante vem da base aprovada. O objetivo do conteúdo armazena a ocupação nesse modelo. A frase usa quebras de linha manuais, e a prévia deve ser conferida antes de aprovar. O retrato precisa ser um PNG com fundo transparente, previamente recortado e autorizado; fotos com fundo sólido criam um retângulo dentro da composição e não são aceitas pelo envio específico desse modelo.
- `docs/referencia-institucional.jpg`: modelo institucional de folha única, 1080 × 1440; logo azul oficial no topo esquerdo, manchete azul e apoio preto na parte inferior. O template institucional da Azul360 segue essa composição.
- `docs/referencia-time.jpg`: foto do time, 1080 × 1440; logo branca oficial no topo esquerdo, três linhas finas e última linha em destaque sobre a foto, com degradê azul inferior. O template carrega `Gilroy-Regular.ttf` nas primeiras linhas e `Gilroy-SemiBold.ttf` na última. A aparência fina da referência pode corresponder a outra variante da família; confirmar a variante com o arquivo original antes de considerar a correspondência tipográfica exata. Troque a foto de exemplo por uma foto aprovada antes de usar.
- `docs/referencia-carrossel-foto.jpg`: página fotográfica do carrossel, usada para comparar escala e posição dos títulos.
- `docs/referencia-noticia-alternativa.jpg`: referência adicional com cinco páginas para notícias, formas gráficas, fotografia e textos curtos. O editor do MVP ainda usa o carrossel compartilhado dos modelos 2 e 4; a composição alternativa e seus elementos 3D ainda não foram implementados. Os números e regras exibidos nessa referência não devem ser reutilizados como notícia sem fonte e data confirmadas.

As medidas CSS padronizam funções de texto no layout implementado. O editor permite texto livre; revise a prévia após alterações longas para evitar excesso de texto.

A migração `20260923163000_carousel_reference` adiciona o campo `slides`. Execute `npx prisma migrate deploy` depois de atualizar uma instalação existente. Conteúdos antigos dos modelos 2 e 4 devem ser abertos e salvos novamente no novo editor antes de exportar.
