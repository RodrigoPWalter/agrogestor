# Política de segurança

O AgroGestor ainda é um projeto em evolução e não deve ser tratado como produto comercial multiusuário sem uma revisão adicional de segurança, isolamento de dados e operação.

## Como reportar um problema

Se encontrar uma falha de segurança, abra uma issue privada ou entre em contato diretamente com o mantenedor do projeto antes de divulgar detalhes publicamente.

Inclua, quando possível:

- descrição do problema;
- passos para reproduzir;
- impacto esperado;
- versão/commit afetado;
- prints ou logs sem dados sensíveis.

## Escopo atual

São considerados dentro do escopo:

- autenticação e sessão;
- autorização de acesso à API;
- exposição indevida de dados;
- falhas de validação;
- problemas em integrações externas;
- configurações inseguras de produção.

## Pontos conhecidos

- Os dados operacionais são isolados por propriedade no banco e nos services, com cenários de integração cobrindo acesso entre contas. Uma oferta comercial ainda exige auditoria independente e testes de invasão.
- O token JWT é armazenado no navegador para manter a experiência simples do PWA. Uma vulnerabilidade de XSS poderia expor essa credencial; o frontend não deve renderizar HTML externo sem sanitização.
- O Swagger fica habilitado apenas no desenvolvimento local e é desativado pelo perfil de produção.
- O login possui limite por endereço de origem. Como o controle é mantido em memória, ele deve migrar para um armazenamento compartilhado caso a API passe a executar em várias instâncias.
- A assinatura JWT também valida o emissor configurado, e cada resposta inclui `X-Request-Id` para permitir a correlação entre um erro informado pelo usuário e os logs da API.
- O frontend publicado envia cabeçalhos contra incorporação em páginas externas, detecção indevida de conteúdo e acesso desnecessário a câmera, microfone ou localização.
- Dados consultados e lançamentos pendentes offline ficam armazenados no aparelho. O usuário deve proteger o celular e evitar limpar os dados do PWA antes da sincronização.
- O fluxo atual cria uma propriedade separada para cada conta. Compartilhamento de uma propriedade por equipe, convites e permissões mais detalhadas ainda não foram implementados.

Esses pontos estão documentados para orientar a evolução do projeto e não devem ser ignorados em um cenário comercial.
