# Changelog

Todas as mudanças relevantes do AgroGestor serão documentadas neste arquivo.

O projeto segue uma variação simples de versionamento semântico enquanto ainda está em fase de MVP.

## Em desenvolvimento

- Novo módulo de Produção com saldo derivado das colheitas e visão consolidada por safra.
- Vendas da produção com data, comprador, quantidade, preço por saca, faturamento e preço médio realizado.
- O fechamento agora separa resultado realizado de projeção para o saldo ainda não vendido.
- Proteção transacional contra venda acima do saldo e contra redução de colheita já comprometida por vendas.
- Cada máquina agora apresenta gastos totais, preventivos e corretivos, com quantidades e filtros no histórico de manutenções.
- O fechamento da safra agora salva o preço efetivamente recebido por saca de 60 kg para consultas futuras no histórico.
- O Diário agora registra etapas de semeadura e colheita com hectares, atualizando o progresso do plantio pela mesma regra usada em seus detalhes.
- O custo médio atual de produtos em estoque pode ser ajustado com data, motivo e histórico, sem reescrever gastos já atribuídos às safras.
- Correção do acumulado mensal de chuva em meses com 31 dias.
- Chuvas e manutenções criadas pelo Diário agora indicam sua origem e são editadas somente no lançamento original.
- Limpeza automática das chaves de idempotência antigas, sem afetar dados operacionais.
- Verificação local de formatação alinhada ao pipeline de CI.
- Fila de sincronização offline no IndexedDB para plantios, gastos, Diário, chuvas, estoque e manutenções.
- Reutilização offline de respostas da API que já foram carregadas no aparelho.
- Acesso local temporário após o primeiro login online, sem enviar tokens vencidos ao backend.
- Chaves de idempotência no backend para impedir registros duplicados durante a sincronização.
- Painel para acompanhar, repetir ou descartar lançamentos pendentes no aparelho.
- Proteção interna contra envios duplicados durante salvamentos demorados.
- Recuperação por usuário dos rascunhos de Plantios, Gastos e Diário por até sete dias.
- Respostas antigas são ignoradas ao trocar rapidamente filtros e seleções.
- Mensagens de rede diferenciam falta de internet, timeout e inicialização do servidor.
- Limite de tentativas repetidas no endpoint de login.
- Teste de inicialização completa e integração com PostgreSQL no CI.
- Perfil de produção mais leve, com pool de conexões ajustado e OpenAPI desativada.
- Índices compostos para consultas operacionais de plantios, gastos e Diário.
- Backup do Neon com SSL explícito e verificação automática pelo `pg_restore`.
- Tela de recuperação para falhas de carregamento, evitando que o aplicativo fique em branco.
- Modais protegidos contra fechamento por toque acidental e bloqueados durante o salvamento.
- Carregamento de módulos orientado pela navegação, respeitando economia de dados e conexões lentas.
- Cotações carregadas depois dos indicadores essenciais para reduzir a disputa de rede no primeiro acesso.
- Confirmações próprias e responsivas para exclusões, finalização e reativação de plantios.
- Nova identidade visual com monograma `AG`, linhas de plantio e ícones próprios para o PWA.
- Paleta visual própria com verde profundo, dourado moderado e botões de maior contraste.
- Tokens visuais consolidados, marca reutilizável e suporte a foco visível e redução de movimento.
- Colheita por etapas com área diária, produção, unidade, variedade e histórico editável.
- Progresso da colheita, produtividade em sacas por hectare e encerramento somente após 100% da área plantada.
- Lançamento automático das etapas de colheita no Diário e integração direta com o fechamento da safra.
- Cada etapa de plantio registra a variedade de semente utilizada, permitindo várias variedades no mesmo talhão.
- Taxa de semeadura por plantio padronizada em `kg/ha` ou `sementes/ha`.
- Cadastro opcional da distância entre linhas de cada plantio, informada em centímetros.
- Plantios agora começam com zero hectares executados e aceitam etapas de semeadura em diferentes dias.
- Área prevista, área plantada, restante e percentual são recalculados pelo histórico de etapas.
- Cada etapa de plantio gera um lançamento relacionado no Diário da Lavoura.
- Correção da paginação no frontend para evitar truncamento silencioso após 100 registros.
- Cache do Dashboard separado por usuário e limpo no logout.
- Pipeline de CI no GitHub Actions para testes e build.
- Dependabot configurado para Maven, npm e GitHub Actions.

## 0.1.0 - MVP inicial

- API Spring Boot com autenticação JWT.
- Frontend React/Vite responsivo e instalável como PWA.
- Módulos de plantios, gastos, estoque, diário, chuvas, máquinas e cotações.
- Fechamento de safra por plantio.
- Deploy público em Render com PostgreSQL gerenciado.
