# Changelog

Todas as mudanças relevantes do AgroGestor serão documentadas neste arquivo.

O projeto segue uma variação simples de versionamento semântico enquanto ainda está em fase de MVP.

## Em desenvolvimento

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
