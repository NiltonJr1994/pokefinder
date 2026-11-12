# Validação do atualizador · 45003

- Verificação TypeScript, paridade dos catálogos e testes de regressão do atualizador aprovados.
- Testes de retomada, autorização de instalação, recusa sem repetição de telas, cancelamento com consulta de progresso pendente e nova tentativa.
- Plugin de configuração Android idempotente e sincronização do módulo nativo conferidos.
- Compilação Release concluída; APK final assinado com o certificado de produção existente.
- Emulador Android, instalação isolada com o novo atualizador e código de teste 45001: descoberta da release pública 45002, download real de 118,2 MiB dentro do app e validação do APK aprovado.
- Aplicativo encerrado e reaberto durante o teste; arquivo concluído recuperado sem novo download.
- Autorização de instalação por esta fonte concedida no emulador. Ao retornar, o instalador Android foi apresentado automaticamente. Após confirmar, o sistema instalou 45002 e mostrou App updated com o botão Open. A versão instalada foi conferida pelo sistema.
- A instalação final 45003 abriu a confirmação de atualização concluída, exibindo que a nova versão já estava em execução. Preferências do teste foram preservadas.

O teste real foi feito em emulador. Telas e restrições de instalação/reabertura podem variar em aparelhos de fabricantes diferentes. Instalação silenciosa e reinício forçado em segundo plano não são implementados.
