DOCUMENTO DE ANÁLISE DE REQUISITOS
Sistema de Controle de Fazenda Leiteira

1. Introdução
1.1 Objetivo
Este documento tem como objetivo descrever os requisitos funcionais e não funcionais para o desenvolvimento de um sistema de controle de fazenda leiteira, visando otimizar a gestão da produção, controle dos animais e tomada de decisão.
1.2 Escopo do Sistema
O sistema permitirá o gerenciamento completo de uma fazenda leiteira, incluindo cadastro de fazendas, controle de bovinos, acompanhamento de produção de leite, gestão reprodutiva e controle de estoque de leite (tanque).

2. Definições, Acrônimos e Abreviações
Bovino: Animal da espécie bovina (vacas, touros, bezerros)
Lactação: Período em que a vaca está produzindo leite
Inseminação Artificial (IA): Técnica de reprodução assistida

3. Visão Geral do Sistema
O sistema será utilizado por produtores rurais, administradores de fazenda e técnicos, permitindo controle detalhado das operações leiteiras.

4. Requisitos Funcionais
4.1 Cadastro de Fazenda
RF01: O sistema deve permitir cadastrar fazendas
RF02: O sistema deve permitir editar dados da fazenda
RF03: O sistema deve permitir excluir fazendas
RF04: O sistema deve permitir visualizar dados da fazenda
4.2 Cadastro de Bovinos
RF05: O sistema deve permitir cadastrar bovinos
RF06: O sistema deve permitir registrar informações como:
Identificação (brinco)
Nome
Raça
Data de nascimento
Sexo
Situação (ativa, vendida, morta)
RF07: O sistema deve permitir editar dados dos bovinos
RF08: O sistema deve permitir consultar bovinos
4.3 Cadastro de Bezerros
RF09: O sistema deve permitir registrar nascimento de bezerros
RF10: O sistema deve vincular bezerro à mãe
RF11: O sistema deve registrar data de nascimento
RF12: O sistema deve registrar sexo do bezerro
4.4 Controle de Produção de Leite
RF13: O sistema deve registrar produção de leite por vaca
RF14: O sistema deve permitir lançamentos diários
RF15: O sistema deve calcular produção total por período
RF16: O sistema deve gerar ranking das vacas mais produtivas
4.5 Controle de Lactação
RF17: O sistema deve identificar vacas em lactação
RF18: O sistema deve registrar início e fim da lactação
RF19: O sistema deve emitir relatórios de vacas em lactação
4.6 Controle Reprodutivo
RF20: O sistema deve registrar inseminações
RF21: O sistema deve diferenciar tipo de inseminação:
Natural
Inseminação Artificial
RF22: O sistema deve registrar data da inseminação
RF23: O sistema deve registrar o responsável
RF24: O sistema deve permitir acompanhamento de prenhez
4.7 Controle de Tanque de Leite
RF25: O sistema deve registrar entrada de leite no tanque
RF26: O sistema deve registrar saída de leite
RF27: O sistema deve controlar volume atual do tanque
RF28: O sistema deve emitir alertas de capacidade máxima
4.8 Relatórios
RF29: O sistema deve gerar relatórios de produção
RF30: O sistema deve gerar relatórios por animal
RF31: O sistema deve gerar relatórios reprodutivos
RF32: O sistema deve gerar ranking de produtividade

5. Requisitos Não Funcionais
5.1 Desempenho
RNF01: O sistema deve responder em até 3 segundos para operações comuns
5.2 Usabilidade
RNF02: O sistema deve possuir interface amigável e intuitiva
5.3 Segurança
RNF03: O sistema deve possuir autenticação de usuários
RNF04: O sistema deve controlar níveis de acesso
5.4 Disponibilidade
RNF05: O sistema deve estar disponível 99% do tempo
5.5 Escalabilidade
RNF06: O sistema deve suportar múltiplas fazendas e grande volume de dados

6. Regras de Negócio
RN01: Apenas vacas podem registrar produção de leite
RN02: Apenas vacas em lactação podem ter produção registrada
RN03: Um bezerro deve estar vinculado a uma vaca mãe
RN04: O volume do tanque não pode ultrapassar sua capacidade máxima
RN05: A inseminação deve ser registrada antes do diagnóstico de prenhez

7. Casos de Uso (Resumo)
UC01: Cadastrar Fazenda
UC02: Cadastrar Bovino
UC03: Registrar Produção de Leite
UC04: Registrar Inseminação
UC05: Registrar Nascimento de Bezerro
UC06: Consultar Relatórios

8. Regras Avançadas
8.1 Previsão de Produção de Leite
RA01: O sistema deve calcular a previsão de produção de leite por vaca com base no histórico
RA02: O sistema deve considerar média dos últimos períodos (diário, semanal e mensal)
RA03: O sistema deve permitir projeção de produção futura
RA04: O sistema deve gerar previsão de produção total da fazenda
RA05: O sistema deve permitir análise comparativa entre produção real e prevista
8.2 Curva de Lactação
RA06: O sistema deve gerar a curva de lactação por vaca
RA07: O sistema deve identificar pico de produção
RA08: O sistema deve identificar queda de produção ao longo do tempo
RA09: O sistema deve permitir visualização gráfica da curva de lactação
RA10: O sistema deve alertar quando houver queda anormal na produção
8.3 Indicadores de Desempenho (KPIs)
RA11: O sistema deve calcular média de produção por vaca
RA12: O sistema deve calcular produção total por período
RA13: O sistema deve identificar as vacas mais e menos produtivas
RA14: O sistema deve calcular taxa de natalidade
RA15: O sistema deve calcular taxa de prenhez
8.4 Inteligência e Alertas
RA16: O sistema deve gerar alertas automáticos para:
Queda brusca de produção
Período ideal de inseminação
Possível problema de saúde
RA17: O sistema deve permitir configuração de limites para alertas

9. Considerações Finais
Este sistema visa melhorar a gestão da produção leiteira, fornecendo dados precisos para tomada de decisão, aumento de produtividade e controle eficiente da fazenda.

