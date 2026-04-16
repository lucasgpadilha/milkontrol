import { Sexo, SituacaoBovino, TipoInseminacao, TipoMovimentacao, TipoSaida, Turno, TipoRegistroSanitario, PapelFazenda } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// Helper para datas passadas (ignorando timezone complexo, gerando em UTC simplificado)
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(12, 0, 0, 0);
  return d;
};

const randomVal = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));

async function main() {
  console.log("Iniciando seed process...");

  // 1. Criar ou atualizar o usuário Milke
  const senhaHash = await bcrypt.hash("milke123", 10);
  const email = "milke@milkontrol.cloud";

  let user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    console.log("Usuário já existe, atualizando senha...");
    user = await prisma.user.update({
      where: { id: user.id },
      data: { senha: senhaHash }
    });
  } else {
    console.log("Criando usuário milke...");
    user = await prisma.user.create({
      data: {
        nome: "Milke User",
        email: email,
        senha: senhaHash,
      }
    });
  }

  const PAST_DAYS = 60; // 60 dias de histórico

  const farmConfigs = [
    {
      nome: "Sítio Vale Verde",
      porte: "Pequeno",
      cidade: "Carmo de Minas",
      estado: "MG",
      ordenhasDia: 2,
      numBovinos: 25,
      numPiquetes: 4,
      tanques: [{ nome: "Tanque Principal", cap: 1500 }],
      producaoMédiaDiaVaca: 18,
      prefix: "VV",
    },
    {
      nome: "Estância Ouro Branco",
      porte: "Médio",
      cidade: "Castro",
      estado: "PR",
      ordenhasDia: 2,
      numBovinos: 85,
      numPiquetes: 10,
      tanques: [{ nome: "Tanque 01", cap: 3000 }, { nome: "Tanque 02", cap: 3000 }],
      producaoMédiaDiaVaca: 28,
      prefix: "OB",
    },
    {
      nome: "Agropecuária São José",
      porte: "Grande",
      cidade: "Carambeí",
      estado: "PR",
      ordenhasDia: 3,
      numBovinos: 200,
      numPiquetes: 20,
      tanques: [
        { nome: "Silo T1", cap: 6000 },
        { nome: "Silo T2", cap: 6000 },
        { nome: "Silo T3", cap: 6000 }
      ],
      producaoMédiaDiaVaca: 35,
      prefix: "SJ",
    }
  ];

  for (const config of farmConfigs) {
    console.log(`\n===========================================`);
    console.log(`Gerando Fazenda [${config.porte}]: ${config.nome}...`);
    
    // Deletar antiga se existir com mesmo nome para não poluir
    const oldFazendas = await prisma.fazenda.findMany({ where: { nome: config.nome } });
    if (oldFazendas.length > 0) {
      console.log(`Removendo registros anteriores de ${config.nome}...`);
      for (const ofz of oldFazendas) {
        await prisma.fazenda.delete({ where: { id: ofz.id } });
      }
    }

    // Criar Fazenda
    const fazenda = await prisma.fazenda.create({
      data: {
        nome: config.nome,
        cidade: config.cidade,
        estado: config.estado,
        ordenhasDia: config.ordenhasDia,
        usuarios: {
          create: {
            userId: user.id,
            papel: "PROPRIETARIO"
          }
        }
      }
    });

    console.log("-> Fazenda criada. ID:", fazenda.id);

    // Setar como ativa se for a primeira
    if (config.prefix === "VV") {
      await prisma.user.update({
        where: { id: user.id },
        data: { fazendaAtivaId: fazenda.id }
      });
    }

    // Piquetes
    const piquetes = [];
    for (let i = 1; i <= config.numPiquetes; i++) {
      const piq = await prisma.piquete.create({
        data: { fazendaId: fazenda.id, nome: `Piquete ${String(i).padStart(2, '0')}` }
      });
      piquetes.push(piq);
    }
    console.log(`-> ${piquetes.length} Piquetes criados.`);

    // Tanques
    const tanques = [];
    for (const t of config.tanques) {
      const tanque = await prisma.tanque.create({
        data: { fazendaId: fazenda.id, nome: t.nome, capacidadeMax: t.cap }
      });
      tanques.push(tanque);
    }
    console.log(`-> ${tanques.length} Tanques criados.`);

    // Veterinário & Banco de Sêmen
    const vet = await prisma.veterinario.create({
      data: { nome: `Dr. Vet ${config.prefix}`, fazendaId: fazenda.id, crmv: `CRMV-MS ${randomVal(1000, 9999)}` }
    });
    
    const semenT1 = await prisma.bancoSemen.create({
      data: { fazendaId: fazenda.id, codigo: `TOURO-${config.prefix}-A`, nomeTouro: `Imperador ${config.prefix}`, quantidade: 50 }
    });

    // Bovinos
    const bovinosToCreate = [];
    for (let i = 1; i <= config.numBovinos; i++) {
      const isFemea = Math.random() > 0.05; // 95% fêmeas
      bovinosToCreate.push({
        brinco: `${config.prefix}-${String(i).padStart(4, '0')}`,
        nome: isFemea ? `Vaca ${config.prefix} ${i}` : `Touro ${config.prefix} ${i}`,
        raca: Math.random() > 0.5 ? "Holandesa" : "Girolando",
        dataNascimento: daysAgo(randomVal(700, 2500)), // Entre 2 e 7 anos
        sexo: isFemea ? Sexo.FEMEA : Sexo.MACHO,
        situacao: SituacaoBovino.ATIVA,
        fazendaId: fazenda.id,
        piqueteId: piquetes[randomVal(0, piquetes.length - 1)].id,
      });
    }

    // Prisma createMany returns count, we need IDs to build relations, so we create normally inside transaction or loop
    // Para simplificar e evitar problemas de payload grande na demo, em blocos:
    console.log(`-> Criando ${config.numBovinos} bovinos...`);
    await prisma.bovino.createMany({ data: bovinosToCreate });
    const bovinos = await prisma.bovino.findMany({ where: { fazendaId: fazenda.id } });

    // Histórico: Lactações & Inseminações
    // Separar apenas as vacas adultas (para ter lactação e inseminação)
    const vacasAdultas = bovinos.filter(b => b.sexo === "FEMEA");
    
    const lactacoesData = [];
    const prodData = [];
    const insemData = [];
    const sanData = [];

    // Definir vacas que estão em lactação "hoje"
    const lactantes = vacasAdultas.filter(() => Math.random() > 0.3); // 70% em lactação

    for (const vaca of lactantes) {
      // Cria uma lactação aberta, começou de 10 a 300 dias atrás
      const diasEmLact = randomVal(10, 300);
      const inicioLact = daysAgo(diasEmLact);
      
      lactacoesData.push({
        bovinoId: vaca.id,
        inicio: inicioLact,
      });

      // Gerar produções diárias nos últimos 60 dias (ou limitados pelos dias de lactacao)
      const diasHistoricoProd = Math.min(PAST_DAYS, diasEmLact);
      
      for (let day = diasHistoricoProd; day >= 0; day--) {
        const prodBase = config.producaoMédiaDiaVaca;
        const fluctuacao = prodBase * 0.15; // +/- 15%
        
        // Simular a curva (caída gradual se a lacração for velha)
        const fatorCurva = Math.max(0.6, 1.2 - (diasEmLact - day) / 300); 
        const litragemTotal = randomFloat(prodBase - fluctuacao, prodBase + fluctuacao) * fatorCurva;
        
        const litrosOrdenha = litragemTotal / config.ordenhasDia;

        // Turno Manhã
        prodData.push({
          bovinoId: vaca.id,
          data: daysAgo(day),
          quantidade: randomFloat(litrosOrdenha * 0.9, litrosOrdenha * 1.1),
          turno: Turno.MANHA,
        });

        // Turno Tarde
        prodData.push({
          bovinoId: vaca.id,
          data: daysAgo(day),
          quantidade: randomFloat(litrosOrdenha * 0.9, litrosOrdenha * 1.1),
          turno: Turno.TARDE,
        });

        // Turno Noite
        if (config.ordenhasDia === 3) {
          prodData.push({
            bovinoId: vaca.id,
            data: daysAgo(day),
            quantidade: randomFloat(litrosOrdenha * 0.9, litrosOrdenha * 1.1),
            turno: Turno.NOITE,
          });
        }
      }
    }

    console.log(`-> Gerando ${lactacoesData.length} lactações e ${prodData.length} registros de produção...`);
    await prisma.lactacao.createMany({ data: lactacoesData });
    
    // Chunk array in 5000 to avoid large payload errors
    const chunkSize = 5000;
    for (let c = 0; c < prodData.length; c += chunkSize) {
      await prisma.producaoLeite.createMany({ data: prodData.slice(c, c + chunkSize) });
    }

    // Inseminações
    const vacasParaInseminar = vacasAdultas.filter(() => Math.random() > 0.6); // 40% foram inseminadas
    for (const vaca of vacasParaInseminar) {
      const diasInsem = randomVal(10, PAST_DAYS);
      insemData.push({
        bovinoId: vaca.id,
        data: daysAgo(diasInsem),
        tipo: TipoInseminacao.ARTIFICIAL,
        responsavel: vet.nome,
        veterinarioId: vet.id,
        bancoSemenId: semenT1.id,
        prenhez: diasInsem > 30 ? Math.random() > 0.4 : null, // Se passou 30 dias, tem diagnóstico 60% de chance preenhez
        dataDiagnostico: diasInsem > 30 ? daysAgo(diasInsem - 30) : null
      });
    }
    console.log(`-> Gerando ${insemData.length} inseminações...`);
    await prisma.inseminacao.createMany({ data: insemData });

    // Sanidade (algumas vacinas nos últimos dias para gerar alertas)
    const vacasSanidade = vacasAdultas.filter(() => Math.random() > 0.85); // 15% tiveram tratamento
    for (const vaca of vacasSanidade) {
       const diasAtras = randomVal(1, 10);
       const diasCar = randomVal(5, 15);
       
       const end = daysAgo(diasAtras);
       end.setDate(end.getDate() + diasCar);

       sanData.push({
         bovinoId: vaca.id,
         data: daysAgo(diasAtras),
         tipo: TipoRegistroSanitario.MEDICAMENTO,
         produto: "Antibiótico Larga Ação",
         diasCarencia: diasCar,
         fimCarencia: end,
         responsavel: vet.nome,
         veterinarioId: vet.id
       });
    }
    console.log(`-> Gerando ${sanData.length} registros sanitários...`);
    await prisma.registroSanitario.createMany({ data: sanData });

    // Movimentações de Tanques para os últimos 60 dias
    const movData = [];
    const sumDailyProd = new Map<number, number>(); 
    
    // Primeiro vou somar a produção diária por dia passado
    for(const p of prodData) {
      const d = Math.floor((new Date().getTime() - p.data.getTime()) / (1000 * 3600 * 24));
      sumDailyProd.set(d, (sumDailyProd.get(d) || 0) + p.quantidade);
    }

    const tIds = tanques.map(t => t.id);

    // Registrar tanque
    for (let day = PAST_DAYS; day >= 0; day--) {
      const litragemTotal = sumDailyProd.get(day) || 0;
      if (litragemTotal > 0) {
        let distribLitragem = litragemTotal;
        // Dividir a produção total entre os tanques como entrada
        for (const tId of tIds) {
          const quota = litragemTotal / tIds.length;
          movData.push({
             tanqueId: tId,
             data: daysAgo(day),
             tipo: TipoMovimentacao.ENTRADA,
             quantidade: quota
          });
        }
        
        // Simular coleta de Laticínio a cada 2 dias (ou diariamente para Grande Porte)
        const coletaFreq = config.porte === "Grande" ? 1 : 2;
        if (day % coletaFreq === 0) {
            for (const tId of tIds) {
              const capT = tanques.find(x => x.id === tId)!.capacidadeMax;
              // Esvaziaremos quase tudo que há acumulado (estimando que coletam todo período e sobra um fundinho)
              movData.push({
                tanqueId: tId,
                data: daysAgo(day),
                tipo: TipoMovimentacao.SAIDA,
                tipoSaida: TipoSaida.VENDA,
                quantidade: (litragemTotal / tIds.length) * coletaFreq * 0.95, // Vende
                comprador: "Laticínio Litoral",
                precoLitro: randomFloat(2.50, 3.10)
             });
            }
        }
      }
    }
    
    console.log(`-> Gerando ${movData.length} movimentações de tanque...`);
    await prisma.movimentacaoTanque.createMany({ data: movData });
  }

  console.log("\n===========================================");
  console.log("SUCESSO! Seed mockup concluído.");
  console.log("Email: milke@milkontrol.cloud");
  console.log("Senha: milke123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
