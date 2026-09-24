# Regras para continuar o projeto

- Mantenha qualquer logo oficial como arquivo original; nunca redesenhe ou invente símbolos.
- Texto da arte deve permanecer editável antes de renderizar o PNG.
- Notícias exigem fonte e data antes da aprovação. Não invente taxas, prazos ou critérios de crédito.
- Publicação requer aprovação humana registrada. Use a API oficial da Meta.
- Nunca inclua tokens, credenciais ou fotos privadas no repositório.
- Preserve as migrações Prisma e adicione testes quando uma integração externa trouxer risco de duplicação/publicação incorreta.
- Os modelos NEWS e CREDIT_EXPLAINER compartilham a sequência de cinco layouts de `components/templates/CarouselArtwork.tsx`, baseada em `docs/referencia-carrossel.png`. Não altere posições, paleta ou ordem sem uma nova referência aprovada.
- O institucional e a foto do time da Azul360 seguem `docs/referencia-institucional.jpg` e `docs/referencia-time.jpg`: logo oficial no topo esquerdo, corpo editável, tipografia Gilroy e composição 1080 × 1440. `docs/referencia-noticia-alternativa.jpg` documenta outra composição do modelo 2; não apresente o layout compartilhado atual como reprodução dessa nova referência.
- Gilroy Bold nos títulos; Gilroy Regular e SemiBold nos textos pequenos. Os arquivos TTF fornecidos pela equipe estão em `public/fonts/`; preserve-os nos ambientes de prévia e exportação.
- Exceção expressa do usuário: no modelo de foto do time, as primeiras linhas usam **Gilroy Regular (peso 400)** e a última linha destacada, como “SEU CRÉDITO.”, usa **Gilroy SemiBold (peso 600)**, conforme `docs/referencia-time.jpg`. Não aplicar Gilroy Bold nesse destaque.
- Nunca rasterize palavras dentro das fotos. Os títulos e CTAs continuam campos de texto editáveis e são renderizados pelo navegador no PNG final.
- O **modelo Frase** da Azul360 parte da referência `docs/referencia-modelo-frase.png` (1086 × 1448) e da base visual gerada e aprovada `public/reference/modelo-frase-base.png` (1087 × 1447). O editor e a exportação usam a base aprovada em 1080 × 1440. A diferença de dimensões e o fato de a base ser gerada impedem alegar identidade pixel a pixel com a referência. Preserve logo, paleta, grafismos, assinatura fixa e layout da base. Somente foto do autor, frase, nome e ocupação podem variar. Nunca gere ou redesenhe a logo. Confira o encaixe da foto e do texto na prévia antes de aprovar.
- Geração automática deve manter fonte e data de publicação visíveis, deixar data do acontecimento pendente se não confirmada, e nunca completar taxas, prazos, elegibilidade ou nomes de linhas por suposição. O retrato de autor precisa ser real, autorizado e associado ao nome; quando faltar, marcar pendência. As fotos do Drive só podem ser importadas da pasta cadastrada no perfil.
- O catálogo de fontes deve manter um único canal por publicação. Não aumente a contagem repetindo unidades ou editorias da mesma organização. Diferencie portais cadastrados de fontes cuja coleta real teve sucesso; se um site não anunciar RSS/Atom, registre a pendência sem inventar endpoint nem tratar notícias antigas como nova coleta.
