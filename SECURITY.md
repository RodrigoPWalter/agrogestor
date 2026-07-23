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

- O projeto ainda não implementa isolamento por propriedade/organização.
- O token JWT é armazenado no navegador para manter a experiência simples do PWA.
- O Swagger fica público no ambiente atual por conveniência de portfólio.
- Não há rate limit no login nesta fase.

Esses pontos estão documentados para orientar a evolução do projeto e não devem ser ignorados em um cenário comercial.
