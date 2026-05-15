# ALI - Registro de Contrato

Esta demo simula o registro de um contrato já assinado, garantindo que o documento não seja alterado após a confirmação.

A ALI não cria nem armazena o contrato. Ela registra uma referência do documento no momento da assinatura, permitindo verificar posteriormente se houve alteração.

---

## Como funciona o registro de contrato

A função de registrar contratos com hash possui duas ações principais.

### 1. Registrar contrato assinado

Utiliza a rota: `POST /sign-contract`

Essa ação deve ser usada quando o empreendedor já assinou o contrato e deseja registrá-lo na ALI.

O que acontece:
- o sistema recebe o conteúdo do contrato
- gera um hash (impressão digital do documento)
- registra esse hash na Stellar Testnet
- retorna um comprovante com o ID da transação

---

### 2. Verificar contrato

Utiliza a rota: `POST /verify-contract`

Essa ação permite verificar se o contrato atual continua igual ao que foi registrado.

O que acontece:
- o sistema recebe o contrato atual
- gera um novo hash
- compara com o hash original
- informa se o documento foi alterado ou não

---

## Fluxo de assinatura

```text
contrato assinado -> SHA256 -> hash -> MEMO("contract_" + parte do hash) -> Stellar -> tx_hash