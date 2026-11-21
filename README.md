# Desafio de Testes — Ludo (`desafio_teste_ludo`)

## 1. Identificação do Desafio

Este repositório é a entrega do **Desafio de Testes: Ludo**, proposto na disciplina de Engenharia de Software da **Unicesumar**. O objetivo é implementar, em JavaScript, tanto as regras do jogo Ludo quanto uma suíte de testes automatizados que valide completamente essas regras.

A especificação completa encontra-se em [`especifica_o_e_guia_do_desafio_ludo.md`](./especifica_o_e_guia_do_desafio_ludo.md).

---

## 2. Como instalar e executar os testes

### Pré-requisitos

- [Node.js](https://nodejs.org/) ≥ 18
- [npm](https://www.npmjs.com/) ≥ 9 (incluído com o Node.js)

### Instalação das dependências

```bash
npm install
```

### Executar a suíte de testes

```bash
npm test
```

Isso executa o **Jest** e gera um relatório de cobertura de código na pasta `coverage/`.

### Executar em modo watch (desenvolvimento)

```bash
npm run test:watch
```

---

## 3. Estrutura do Projeto

```text
desafio_teste_ludo/
├── src/
│   └── ludo.js          # Implementação das regras e estado do jogo
├── tests/
│   ├── ludo.test.js     # Testes: CT01–CT09 (Inicialização, Base, Movimentação, Captura, Bloqueio)
│   └── ludo.final.test.js # Testes: CT10–CT14 (Reta Final e Vitória)
├── package.json
├── .gitignore
└── README.md
```

---

## 4. Variação de Regras Implementada

Conforme a especificação do desafio, a saída da base exige que o jogador tire **6** no dado (variação padrão). A regra alternativa de sair com **1 ou 6** não está implementada nesta versão.

---

## 5. Casos de Teste Cobertos

| ID    | Categoria    | Cenário                                              | Arquivo              |
|:------|:-------------|:-----------------------------------------------------|:---------------------|
| CT01  | Inicialização | Início com 2 jogadores                              | `ludo.test.js`       |
| CT02  | Inicialização | Sorteio de ordem inicial pelo dado                  | `ludo.test.js`       |
| CT03  | Saída da Base | Dado ≠ 6 com todos peões na base                   | `ludo.test.js`       |
| CT04  | Saída da Base | Dado = 6 move peão da base + jogada extra           | `ludo.test.js`       |
| CT05  | Movimentação  | Avanço simples no percurso comum                    | `ludo.test.js`       |
| CT06  | Dado Extra    | Tirar 6 garante nova jogada                         | `ludo.test.js`       |
| CT07  | Captura       | Parar em casa com 1 peão adversário                 | `ludo.test.js`       |
| CT08  | Bloqueio      | 2 peões aliados formam torre (bloqueio)             | `ludo.test.js`       |
| CT09  | Bloqueio      | Peão adversário não pode ultrapassar/capturar torre | `ludo.test.js`       |
| CT10  | Reta Final    | Entrada na reta final após volta completa           | `ludo.final.test.js` |
| CT11  | Reta Final    | Avanço parcial dentro da reta final                 | `ludo.final.test.js` |
| CT12  | Reta Final    | Chegada com número exato                            | `ludo.final.test.js` |
| CT13  | Reta Final    | Excesso de pontos — "bate e volta"                  | `ludo.final.test.js` |
| CT14  | Vitória       | Todos os 4 peões no ponto final → vencedor declarado | `ludo.final.test.js` |

---

## 6. Colaboradores

| Nome             | GitHub           | E-mail                    |
|:-----------------|:-----------------|:--------------------------|
| Vinicius Almeida | ViniciusAlmeid4  | cmpalmeidaa@gmail.com     |
| *(parceiro)*     | *(a preencher)*  | *(a preencher)*           |
