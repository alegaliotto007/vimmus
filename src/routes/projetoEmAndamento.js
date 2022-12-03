require('../model/Cliente');
require('../model/Pessoa');
require('../model/Tarefas');
require('../model/Equipe');
require('../model/Projeto');
require('../model/Pedido');

require('dotenv').config();

const { ehAdmin } = require('../helpers/ehAdmin');

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const Cliente = mongoose.model('cliente');
const Pessoa = mongoose.model('pessoa');
const Tarefas = mongoose.model('tarefas');
const Equipe = mongoose.model('equipe');
const Projeto = mongoose.model('projeto');
const Pedido = mongoose.model('pedido');

const dataBusca = require('../resources/dataBusca');
const setData = require('../resources/setData');
const dataMensagem = require('../resources/dataMensagem');
const dataHoje = require('../resources/dataHoje');
const naoVazio = require('../resources/naoVazio');
const comparaNum = require('../resources/comparaNumeros');

async function salvarObservacao(projeto, obsprojetista, id, pessoa) {
    let pessoas = await Pessoa.findById(pessoa);
    let nome_pessoa = pessoas.nome;
    if (obsprojetista != '') {
        var time = String(new Date(Date.now())).substring(16, 21);
        var newdate = dataMensagem(dataHoje());
        if (naoVazio(projeto.obsprojetista)) {
            oldtext = projeto.obsprojetista;
        } else {
            oldtext = '';
        }
        var newtext = '\n' + `[${newdate} - ${time}] por ${nome_pessoa}` + '\n' + obsprojetista + '\n' + oldtext;
        await Projeto.updateOne({ _id: id }, { $set: { obsprojetista: newtext } });
    }
}

router.get('/emandamento/', ehAdmin, (req, res) => {

    const { _id } = req.user
    const { user } = req.user
    var id

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    let seq
    let cliente
    let nome_cliente
    let parado
    let autorizado
    let pagamento
    let instalado
    let execucao
    let instalador
    let cidade
    let uf
    let telhado
    let estrutura
    let inversor
    let modulos
    let potencia
    let sistema
    let deadline
    let ins_banco
    let checkReal
    let nome_ins_banco
    let id_ins_banco
    let nome_ins
    let id_ins
    let pedido
    var observacao
    var obsprojetista

    var listaAndamento = []
    var addInstalador = []

    var hoje = dataHoje()
    var anotitulo = hoje.substring(0, 4)
    const dataini = anotitulo + '-01' + '-01'
    const datafim = anotitulo + '-12' + '-31'
    const dtini = parseFloat(dataBusca(dataini))
    const dtfim = parseFloat(dataBusca(datafim))

    //console.log('entrou')
    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, funins: 'checked' }).lean().then((todos_instaladores) => {

            // Equipe.aggregate([
            //     {
            //         $match: {
            //             user: id,
            //             tarefa: { $exists: false },
            //             nome_projeto: { $exists: true },
            //             baixada: { $ne: true },
            //             "dtfimbusca": {
            //                 $gte: dtini,
            //                 $lte: dtfim,
            //             }
            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: 'projetos',
            //             localField: '_id',
            //             foreignField: 'equipe',
            //             as: 'projeto'
            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: 'pessoas',
            //             localField: 'insres',
            //             foreignField: '_id',
            //             as: 'instalador',
            //         }
            //     }
            // ]).then(async list => {

            //     for (const item of list) {
            //         observacao = item.observacao;
            //         deadline = await item.dtfim;
            //         if (naoVazio(deadline) == false) {
            //             deadline = '0000-00-00';
            //         }
            //         qtdmod = await item.qtdmod;


            //         let projetos = await item.projeto;
            //         let instaladores = await item.instalador;

            //         if (projetos.length > 0) {

            //             projetos.map(async register => {
            //                 id = register._id
            //                 seq = register.seq
            //                 cidade = register.cidade
            //                 uf = register.uf
            //                 telhado = register.telhado
            //                 estrutura = register.estrutura
            //                 inversor = register.plaKwpInv
            //                 modulos = register.plaQtdMod
            //                 potencia = register.plaWattMod
            //                 instalado = register.instalado
            //                 execucao = register.execucao
            //                 parado = register.parado
            //                 autorizado = register.autorizado
            //                 pagamento = register.pago
            //                 cliente = register.cliente
            //                 ins_banco = register.ins_banco
            //                 checkReal = register.ins_real
            //                 pedido = register.pedido
            //                 obsprojetista = register.obsprojetista

            //                 if (checkReal != true) {
            //                     checkReal = 'unchecked';
            //                 } else {
            //                     checkReal = 'checked';
            //                 }

            //                 if (naoVazio(modulos) && naoVazio(potencia)) {
            //                     sistema = ((modulos * potencia) / 1000).toFixed(2);
            //                 } else {
            //                     sistema = 0;
            //                 }

            //             })

            //             if (naoVazio(pedido)) {

            //                 instaladores.map(async register => {
            //                     instalador = register.nome;

            //                     nome_ins = instalador;
            //                     id_ins = register._id;

            //                     if (naoVazio(ins_banco)) {
            //                         if (register._id == ins_banco) {
            //                             addInstalador = [{ instalador, qtdmod }];
            //                         } else {
            //                             let nome_instalador = await Pessoa.findById(ins_banco);
            //                             addInstalador = [{ instalador: nome_instalador.nome, qtdmod }];
            //                         }
            //                     } else {
            //                         addInstalador = [{ instalador, qtdmod }];
            //                     }
            //                 })

            //                 if (naoVazio(ins_banco)) {
            //                     await Pessoa.findById(ins_banco).then(this_ins_banco => {
            //                         nome_ins_banco = this_ins_banco.nome;
            //                         id_ins_banco = this_ins_banco._id;
            //                     })
            //                 } else {
            //                     nome_ins_banco = '';
            //                     id_ins_banco = '';
            //                 }

            //                 await Cliente.findById(cliente).then(this_cliente => {
            //                     nome_cliente = this_cliente.nome;
            //                 })

            //                 listaAndamento.push({
            //                     id, seq, parado, execucao, autorizado, pagamento, observacao, obsprojetista,
            //                     instalado, cliente: nome_cliente, cidade, uf, telhado, estrutura,
            //                     sistema, modulos, potencia, inversor, deadline, addInstalador,
            //                     dtfim: dataMensagem(deadline), nome_ins_banco, id_ins_banco, nome_ins, id_ins, checkReal
            //                 })

            //                 addInstalador = [];
            //             }
            //         }
            //     }

            Equipe.aggregate([
                {
                    $match: {
                        user: id,
                        tarefa: { $exists: false },
                        nome_projeto: { $exists: true },
                        baixada: { $ne: true },
                        "dtfimbusca": {
                            $gte: dtini,
                            $lte: dtfim,
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'projetos',
                        localField: 'projeto',
                        foreignField: '_id',
                        as: 'projeto'
                    }
                },
                {
                    $lookup: {
                        from: 'projetos',
                        localField: '_id',
                        foreignField: 'equipe',
                        as: 'projeto_equipe'
                    }
                },
                {
                    $lookup: {
                        from: 'pessoas',
                        localField: 'insres',
                        foreignField: '_id',
                        as: 'instalador',
                    }
                }
            ]).then(async list => {

                for (const item of list) {
                    observacao = item.observacao;
                    deadline = await item.dtfim;
                    if (naoVazio(deadline) == false) {
                        deadline = '0000-00-00';
                    }
                    qtdmod = await item.qtdmod;

                    let projetos = await item.projeto;
                    let projetos_equipe = await item.projeto_equipe;
                    let instaladores = await item.instalador;

                    if (projetos.length > 0) {

                        projetos.map(async register => {
                            id = register._id
                            seq = register.seq
                            cidade = register.cidade
                            uf = register.uf
                            telhado = register.telhado
                            estrutura = register.estrutura
                            inversor = register.plaKwpInv
                            modulos = register.plaQtdMod
                            potencia = register.plaWattMod
                            instalado = register.instalado
                            execucao = register.execucao
                            parado = register.parado
                            autorizado = register.autorizado
                            pagamento = register.pago
                            cliente = register.cliente
                            ins_banco = register.ins_banco
                            checkReal = register.ins_real
                            pedido = register.pedido
                            obsprojetista = register.obsprojetista

                            if (checkReal != true) {
                                checkReal = 'unchecked';
                            } else {
                                checkReal = 'checked';
                            }

                            if (naoVazio(modulos) && naoVazio(potencia)) {
                                sistema = ((modulos * potencia) / 1000).toFixed(2);
                            } else {
                                sistema = 0;
                            }
                        })
                    }

                    if (projetos_equipe.length > 0) {

                        projetos_equipe.map(async register => {
                            id = register._id
                            seq = register.seq
                            cidade = register.cidade
                            uf = register.uf
                            telhado = register.telhado
                            estrutura = register.estrutura
                            inversor = register.plaKwpInv
                            modulos = register.plaQtdMod
                            potencia = register.plaWattMod
                            instalado = register.instalado
                            execucao = register.execucao
                            parado = register.parado
                            autorizado = register.autorizado
                            pagamento = register.pago
                            cliente = register.cliente
                            ins_banco = register.ins_banco
                            checkReal = register.ins_real
                            pedido = register.pedido
                            obsprojetista = register.obsprojetista

                            if (checkReal != true) {
                                checkReal = 'unchecked';
                            } else {
                                checkReal = 'checked';
                            }

                            if (naoVazio(modulos) && naoVazio(potencia)) {
                                sistema = ((modulos * potencia) / 1000).toFixed(2);
                            } else {
                                sistema = 0;
                            }
                        })
                    }

                    if (naoVazio(pedido)) {

                        instaladores.map(async register => {
                            instalador = register.nome;

                            nome_ins = instalador;
                            id_ins = register._id;

                            if (naoVazio(ins_banco)) {
                                if (register._id == ins_banco) {
                                    addInstalador = [{ instalador, qtdmod }];
                                } else {
                                    let nome_instalador = await Pessoa.findById(ins_banco);
                                    addInstalador = [{ instalador: nome_instalador.nome, qtdmod }];
                                }
                            } else {
                                addInstalador = [{ instalador, qtdmod }];
                            }
                        })

                        if (naoVazio(ins_banco)) {
                            await Pessoa.findById(ins_banco).then(this_ins_banco => {
                                nome_ins_banco = this_ins_banco.nome;
                                id_ins_banco = this_ins_banco._id;
                            })
                        } else {
                            nome_ins_banco = '';
                            id_ins_banco = '';
                        }

                        await Cliente.findById(cliente).then(this_cliente => {
                            nome_cliente = this_cliente.nome;
                        })

                        listaAndamento.push({
                            id, seq, parado, execucao, autorizado, pagamento, observacao, obsprojetista,
                            instalado, cliente: nome_cliente, cidade, uf, telhado, estrutura,
                            sistema, modulos, potencia, inversor, deadline, addInstalador,
                            dtfim: dataMensagem(deadline), nome_ins_banco, id_ins_banco, nome_ins, id_ins, checkReal
                        })

                        addInstalador = [];
                    }
                }

                listaAndamento.sort(comparaNum);
                res.render('principal/emandamento', {
                    listaAndamento, todos_clientes,
                    todos_instaladores, datafim, dataini
                })
            })
            // })

        }).catch((err) => {
            req.flash('error_msg', 'Nenhum instalador encontrado.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrado.')
        res.redirect('/dashboard')
    })
});

router.post('/enviarEquipe/', ehAdmin, async (req, res) => {
    const { user } = req.user
    const { _id } = req.user
    var id

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    var mensagem
    var tipo

    const check = req.body.check

    const ins_realizado = await Pessoa.findById(req.body.ins_realizado)
    try {

    } catch (error) {

    }
    var projeto = await Projeto.findOne({ _id: req.body.id })
    if (naoVazio(projeto)) {
        let equipe;
        equipe = await Equipe.findOne({ _id: projeto.equipe })
        if (!naoVazio(equipe)) {
            equipe = await Equipe.findOne({ projeto: req.body.id })
        }
        Pessoa.findOne({ _id: equipe.insres }).then((instalador) => {
            Cliente.findOne({ _id: projeto.cliente }).then((cliente) => {
                if (projeto.parado == false && projeto.execucao == false) {
                    if (check) {
                        equipe.insres = ins_realizado
                        projeto.ins_real = true
                    } else {
                        projeto.ins_real = false
                        equipe.insres = projeto.ins_banco
                    }
                    projeto.execucao = true
                    projeto.parado = false
                    projeto.dtiniicio = req.body.dtfim
                    projeto.dtfim = req.body.dtfim
                    equipe.liberar = true
                    equipe.dtinicio = req.body.dtfim
                    equipe.dtfim = req.body.dtfim
                    equipe.dtinibusca = dataBusca(req.body.dtfim)
                    equipe.dtfimbusca = dataBusca(req.body.dtfim)
                    projeto.save()
                    equipe.save().then(() => {
                        mensagem = 'Olá ' + instalador.nome + ',' + '\n' +
                            'Instalação programada para o cliente ' + cliente.nome + '\n' +
                            // 'com previsão para inicio em ' + dataMensagem(projeto.dtinicio) + ' e término em ' + dataMensagem(projeto.dtfim) + '.' + '\n' +
                            // 'Acompanhe a obra acessando: https://integracao.vimmus.com.br/gerenciamento/instalacao/' + projeto._id + '.'
                            'Verifique seu aplicativo e aguarde a gerência entrar em contato.'
                        client.messages
                            .create({
                                body: mensagem,
                                from: 'whatsapp:+554991832978',
                                to: 'whatsapp:+55' + instalador.celular
                            })
                            .then((message) => {
                                req.flash('success_msg', 'Instalador alocado para o projeto ' + projeto.seq + '.')
                                res.redirect('/gerenciamento/emandamento')
                            }).done()
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar a equipe.')
                        res.redirect('/gerenciamento/emandamento')
                    })

                } else {
                    if (projeto.parado == false) {
                        projeto.execucao = true
                        projeto.parado = true
                        mensagem = 'Equipe de instalação cancelada'
                        tipo = 'error_msg'
                        equipe.parado = true
                    } else {
                        projeto.execucao = true
                        projeto.parado = false
                        mensagem = 'Equipe de instalação enviada'
                        tipo = 'success_msg'
                        equipe.parado = false
                    }
                    equipe.save()
                    projeto.save().then(() => {
                        //console.log('cliente=>' + cliente)
                        mensagem = mensagem + ' para o cliente ' + cliente.nome + '\n' + '.'
                        // 'com previsão para inicio em ' + dataMensagem(projeto.dtinicio) + ' e término em ' + dataMensagem(projeto.dtfim) + ' foi cancelada.' + '\n' +
                        'Aguarde a gerência entrar em contato.'
                        client.messages
                            .create({
                                body: mensagem,
                                from: 'whatsapp:+554991832978',
                                to: 'whatsapp:+55' + instalador.celular
                            })
                            .then((message) => {
                                req.flash(tipo, mensagem)
                                res.redirect('/gerenciamento/emandamento')
                            }).done()
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar a projeto.')
                        res.redirect('/gerenciamento/emandamento')
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao encontrar o cliente<envia>.')
                res.redirect('/gerenciamento/emandamento')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao encontrar o instalador<envia>.')
            res.redirect('/gerenciamento/emandamento')
        })
    } else {
        Tarefas.findOne({ _id: req.body.id }).then((tarefa) => {
            Equipe.findOne({ _id: tarefa.equipe }).then((equipe) => {
                if (naoVazio(equipe.insres)) {
                    mensagem = 'Equipe liberada para o serviço.'
                    tipo = 'success_msg'
                    equipe.liberar = true
                    equipe.save().then(() => {
                        //console.log('email=>' + email)
                        Pessoa.findOne({ _id: equipe.insres }).then((insres) => {
                            //console.log('insres.nome=>' + insres.nome)
                            req.flash(tipo, mensagem)
                            res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)

                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar o instalador responsável.')
                            res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar a equipe.')
                        res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
                    })
                } else {
                    req.flash('aviso_msg', 'Só será possível libera a equipe para a obra após selecionar um técnico responsável.')
                    res.redirect('/gerenciamento/equipe/' + req.body.id)
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao encontrar a equipe.')
                res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao encontrar a tarefa.')
            res.redirect('/gerenciamento/mostraEquipe/' + req.body.id)
        })
    }
})

router.post('/addInstalador/', ehAdmin, async (req, res) => {
    const { user } = req.user
    const { _id } = req.user
    var id
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    //console.log(req.body.id)
    Projeto.findOne({ _id: req.body.id }).then(async (projeto) => {
        projeto.ins_banco = req.body.instalador
        projeto.save();

        let equipe;

        equipe = await Equipe.findOne({ _id: projeto.equipe });
        if (!naoVazio(equipe)) {
            equipe = await Equipe.findOne({ projeto: req.body.id });
        }

        equipe.insres = req.body.instalador
        equipe.qtdmod = req.body.qtdmod
        equipe.save().then(() => {
            req.flash('success_msg', 'Instalador alocado para o projeto ' + projeto.seq + '.')
            res.redirect('/gerenciamento/emandamento')
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao salvar a equipe.')
            res.redirect('/gerenciamento/emandamento')
        })


    }).catch((err) => {
        req.flash('error_msg', 'Houve erro ao encontrar a projeto.')
        res.redirect('/gerenciamento/emandamento/')
    })
});

router.post('/projeto', ehAdmin, async (req, res) => {

    const { _id } = req.user;
    const { pessoa } = req.user;

    var projeto = new projectFollow(
        req.body.dataPost,
        req.body.dataSoli,
        req.body.dataApro,
        req.body.dataTroca,
        req.body.obsprojetista,
        req.body.id,
        _id,
        pessoa,
        req.body.checkPago,
        req.body.checkAuth
    );

    await projeto.setStatusProject('pago', req.body.chekPaiedRefresh);
    await projeto.setStatusProject('autorizado', req.body.chekAuthRefresh);
    await projeto.saveDate('dataPost', req.body.checkPost, 'postado');
    await projeto.saveDate('dataApro', req.body.checkApro, 'aprovada');
    await projeto.saveDate('dataSoli', req.body.checkSoli, 'solicitada');
    await projeto.saveDate('dataTroca', req.body.checkTroca, 'trocado o medidor');
    await projeto.saveObservation('obsprojetista', req.body.insertObs);

    res.redirect('/gerenciamento/projeto/' + req.body.id);
});

router.post('/obsprojetista', ehAdmin, async (req, res) => {
    const { pessoa } = req.user
    Projeto.findOne({ _id: req.body.idprj }).lean().then((projeto) => {
        salvarObservacao(projeto, req.body.obsprojetistamain, req.body.idprj, pessoa);
        res.redirect('/gerenciamento/emandamento')
    }).catch(() => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/gerenciamento/projeto/' + req.params.id)
    })
});

router.post('/dashInstalador', ehAdmin, async (req, res) => {
    const { user } = req.user
    const { _id } = req.user
    let id

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    let lista_instaladores = []

    let mes
    let ano = req.body.ano

    let janeiro
    let fevereiro
    let marco
    let abril
    let maio
    let junho
    let julho
    let agosto
    let setembro
    let outubro
    let novembro
    let dezembro
    let todos

    let diafim

    //console.log(req.body.mes)

    switch (req.body.mes) {
        case 'Janeiro':
            diafim = '31'
            mes = '01'
            janeiro = 'active'
            break;
        case 'Fevereiro':
            diafim = '28'
            mes = '02'
            fevereiro = 'active'
            break;
        case 'Março':
            diafim = '31'
            mes = '03'
            marco = 'active'
            break;
        case 'Abril':
            diafim = '30'
            mes = '04'
            abril = 'active'
            break;
        case 'Maio':
            diafim = '31'
            mes = '05'
            maio = 'active'
            break;
        case 'Junho':
            diafim = '30'
            mes = '06'
            junho = 'active'
            break;
        case 'Julho':
            diafim = '31'
            mes = '07'
            julho = 'active'
            break;
        case 'Agosto':
            diafim = '31'
            mes = '08'
            agosto = 'active'
            break;
        case 'Setembro':
            diafim = '30'
            mes = '09'
            setembro = 'active'
            break;
        case 'Outubro':
            diafim = '31'
            mes = '10'
            outubro = 'active'
            break;
        case 'Novembro':
            diafim = '30'
            mes = '11'
            novembro = 'active'
            break;
        case 'Dezembro':
            diafim = '31'
            mes = '12'
            dezembro = 'active'
            break;
        default:
            diafim = '31'
            todos = 'active'
            break;
    }
    let dtini
    let dtfim

    if (todos == 'active') {
        dtini = Number(`${ano}0101`)
        dtfim = Number(`${ano}1231`)
    } else {
        dtini = Number(`${ano}${mes}01`)
        dtfim = Number(`${ano}${mes}${diafim}`)
    }

    Equipe.aggregate([
        {
            $match: {
                user: id,
                "dtfimbusca": {
                    $gte: dtini,
                    $lte: dtfim
                }
            }
        },
        {
            $group: {
                _id: "$insres",
                totalQtd: { $sum: "$qtdmod" },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'projetos',
                let: { ins_real: "$_id" },
                pipeline: [{
                    $match: {
                        instalado: false,
                        $expr: {
                            $eq: ["$ins_banco", "$$ins_real"]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$ins_banco",
                        total_qtd_banco: { $sum: "$plaQtdMod" }
                    }
                }],
                as: "banco"
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        {
                            $arrayElemAt:
                                ["$banco", 0]
                        },
                        "$$ROOT"]
                }
            }
        },
        {
            $project: {
                banco: 0
            }
        }
    ]).then(async data => {
        let i = 0
        let mensagem

        if (naoVazio(data)) {
            for (let ins of data) {
                let nome_ins = await Pessoa.findById(ins._id)
                let qtd_real = await ins.totalQtd
                let qtd_banco = await ins.total_qtd_banco
                if (naoVazio(nome_ins)) {
                    lista_instaladores.push({ instalador: nome_ins.nome, qtd_real, qtd_banco, i })
                    i++
                }
            }
        } else {
            mensagem = 'Não existem instaladores com programação para este mês.'
        }
        res.render('principal/dashInstalador', {
            mensagem,
            lista_instaladores, mestitulo: req.body.mes, ano,
            janeiro, fevereiro, marco, abril, maio, junho, julho,
            agosto, setembro, outubro, novembro, dezembro, todos
        })
    })
});

router.get('/removeInstalador/:id', ehAdmin, (req, res) => {
    let params = (req.params.id)
    params = params.split('@')
    Projeto.findById(params[0]).then((projeto) => {
        Equipe.updateOne({ _id: projeto.equipe }, { $unset: { insres: "" } }).then(() => {
            Projeto.updateOne({ _id: params[0] }, { $unset: { ins_banco: "" } }).then(() => {
                Projeto.updateOne({ _id: params[0] }, { $set: { execucao: false, ins_real: false } }).then(() => {
                    req.flash('success_msg', 'Removido ' + params[1] + ' do projeto ' + projeto.seq + '.')
                    res.redirect('/gerenciamento/emandamento')
                })
            })
        })
    })
});

router.post('/emandamento/', ehAdmin, async (req, res) => {

    const { _id } = req.user
    const { user } = req.user
    var id

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    let seq;
    let cliente;
    let nome_cliente;
    let parado;
    let autorizado;
    let pagamento;
    let instalado;
    let execucao;
    let instalador;
    let cidade;
    let uf;
    let telhado;
    let estrutura;
    let inversor;
    let modulos;
    let potencia;
    let sistema;
    let deadline;
    let ins_banco;
    let checkReal;
    let nome_ins;
    let id_ins;
    let nome_ins_banco;
    let id_ins_banco;
    var observacao;
    var obsprojetista;

    var listaAndamento = [];
    var addInstalador = [];

    const dataini = req.body.dataini;
    const datafim = req.body.datafim;
    const dtini = parseFloat(dataBusca(dataini));
    const dtfim = parseFloat(dataBusca(datafim));

    let filter_installer = req.body.instalador;
    let installer_name;
    let filter_status = req.body.status;
    let liberar_status = { $exists: true };
    let prjfeito_status = { $exists: true };
    let parado_status = { $exists: true };
    let sql_installer = {};

    let match = {};

    if (filter_status != 'Todos') {
        switch (filter_status) {
            case 'Aguardando': liberar_status = false; parado_status = false; prjfeito_status = false
                break;
            case 'Execução': liberar_status = true; parado_status = false; prjfeito_status = false
                break;
            case 'Instalado': liberar_status = true; parado_status = false; prjfeito_status = true
                break;
            case 'Parado': liberar_status = true; parado_status = true; prjfeito_status = false
                break;
        }
    }


    if (filter_installer != 'Todos') {
        const id_ins = await Pessoa.findById(filter_installer)
        match = {
            user: id,
            tarefa: { $exists: false },
            nome_projeto: { $exists: true },
            liberar: liberar_status,
            prjfeito: prjfeito_status,
            parado: parado_status,
            insres: id_ins._id,
            "dtfimbusca": {
                $gte: dtini,
                $lte: dtfim
            },
        }
    } else {
        match = {
            user: id,
            tarefa: { $exists: false },
            nome_projeto: { $exists: true },
            liberar: liberar_status,
            prjfeito: prjfeito_status,
            parado: parado_status,
            "dtfimbusca": {
                $gte: dtini,
                $lte: dtfim
            },
        }
    }

    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, funins: 'checked' }).lean().then((todos_instaladores) => {

            Equipe.aggregate([
                {
                    $match: match
                },
                {
                    $lookup: {
                        from: 'projetos',
                        localField: 'projeto',
                        foreignField: '_id',
                        as: 'projeto'
                    }
                },
                {
                    $lookup: {
                        from: 'projetos',
                        localField: '_id',
                        foreignField: 'equipe',
                        as: 'projeto_equipe'
                    }
                },
                {
                    $lookup: {
                        from: 'pessoas',
                        localField: 'insres',
                        foreignField: '_id',
                        as: 'instalador',
                    }
                }
            ]).then(async list => {

                for (const item of list) {
                    observacao = item.observacao;
                    deadline = await item.dtfim;
                    if (naoVazio(deadline) == false) {
                        deadline = '0000-00-00';
                    }
                    qtdmod = await item.qtdmod;

                    for (const item of list) {
                        observacao = item.observacao;
                        deadline = await item.dtfim;
                        if (naoVazio(deadline) == false) {
                            deadline = '0000-00-00';
                        }
                        qtdmod = await item.qtdmod;

                        let projetos = await item.projeto;
                        let projetos_equipe = await item.projeto_equipe;
                        let instaladores = await item.instalador;

                        if (projetos.length > 0) {

                            projetos.map(async register => {
                                id = register._id
                                seq = register.seq
                                cidade = register.cidade
                                uf = register.uf
                                telhado = register.telhado
                                estrutura = register.estrutura
                                inversor = register.plaKwpInv
                                modulos = register.plaQtdMod
                                potencia = register.plaWattMod
                                instalado = register.instalado
                                execucao = register.execucao
                                parado = register.parado
                                autorizado = register.autorizado
                                pagamento = register.pago
                                cliente = register.cliente
                                ins_banco = register.ins_banco
                                checkReal = register.ins_real
                                pedido = register.pedido
                                obsprojetista = register.obsprojetista

                                if (checkReal != true) {
                                    checkReal = 'unchecked';
                                } else {
                                    checkReal = 'checked';
                                }

                                if (naoVazio(modulos) && naoVazio(potencia)) {
                                    sistema = ((modulos * potencia) / 1000).toFixed(2);
                                } else {
                                    sistema = 0;
                                }
                            })
                        }

                        if (projetos_equipe.length > 0) {

                            projetos_equipe.map(async register => {
                                id = register._id
                                seq = register.seq
                                cidade = register.cidade
                                uf = register.uf
                                telhado = register.telhado
                                estrutura = register.estrutura
                                inversor = register.plaKwpInv
                                modulos = register.plaQtdMod
                                potencia = register.plaWattMod
                                instalado = register.instalado
                                execucao = register.execucao
                                parado = register.parado
                                autorizado = register.autorizado
                                pagamento = register.pago
                                cliente = register.cliente
                                ins_banco = register.ins_banco
                                checkReal = register.ins_real
                                pedido = register.pedido
                                obsprojetista = register.obsprojetista

                                if (checkReal != true) {
                                    checkReal = 'unchecked';
                                } else {
                                    checkReal = 'checked';
                                }

                                if (naoVazio(modulos) && naoVazio(potencia)) {
                                    sistema = ((modulos * potencia) / 1000).toFixed(2);
                                } else {
                                    sistema = 0;
                                }
                            })
                        }

                        if (naoVazio(pedido)) {

                            instaladores.map(async register => {
                                instalador = register.nome;

                                nome_ins = instalador;
                                id_ins = register._id;

                                if (naoVazio(ins_banco)) {
                                    if (register._id == ins_banco) {
                                        addInstalador = [{ instalador, qtdmod }];
                                    } else {
                                        let nome_instalador = await Pessoa.findById(ins_banco);
                                        addInstalador = [{ instalador: nome_instalador.nome, qtdmod }];
                                    }
                                } else {
                                    addInstalador = [{ instalador, qtdmod }];
                                }
                            })

                            if (naoVazio(ins_banco)) {
                                await Pessoa.findById(ins_banco).then(this_ins_banco => {
                                    nome_ins_banco = this_ins_banco.nome;
                                    id_ins_banco = this_ins_banco._id;
                                })
                            } else {
                                nome_ins_banco = '';
                                id_ins_banco = '';
                            }

                            await Cliente.findById(cliente).then(this_cliente => {
                                nome_cliente = this_cliente.nome;
                            })

                            listaAndamento.push({
                                id, seq, parado, execucao, autorizado, pagamento, observacao, obsprojetista,
                                instalado, cliente: nome_cliente, cidade, uf, telhado, estrutura,
                                sistema, modulos, potencia, inversor, deadline, addInstalador,
                                dtfim: dataMensagem(deadline), nome_ins_banco, id_ins_banco, nome_ins, id_ins, checkReal
                            })

                            addInstalador = [];
                        }
                    }
                }

                listaAndamento.sort(comparaNum);
                res.render('principal/emandamento', {
                    listaAndamento, todos_clientes,
                    todos_instaladores, datafim, dataini
                })
            })

        }).catch((err) => {
            req.flash('error_msg', 'Nenhum instalador encontrado.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrado.')
        res.redirect('/dashboard')
    })
});

router.get('/projeto/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    const { instalador } = req.user
    const { orcamentista } = req.user
    var id
    var ehMaster = false

    var checkAuth
    var checkPay
    var dtfim

    var proandges = false
    if (funges || funpro) {
        proandges = true
    }

    if (typeof user == 'undefined') {
        id = _id
        ehMaster = true
    } else {
        id = user
        ehMaster = false
    }

    var checkPost = 'unchecked'
    var checkSoli = 'unchecked'
    var checkApro = 'unchecked'
    var checkTroca = 'unchecked'

    var lista_proposta = []

    Pessoa.find({ user: id, funins: 'checked' }).lean().then((instaladores) => {
        Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {

            if (projeto.autorizado) {
                checkAuth = 'checked'
            } else {
                checkAuth = 'unchecked'
            }
            lista_proposta = projeto.proposta

            Pedido.findOne({ _id: projeto.pedido }).lean().then((pedido) => {
                Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {
                    var dtfim = setData(pedido.data, pedido.prazo)
                    if (naoVazio(projeto.dataPost)) {
                        checkPost = 'checked'
                    }
                    if (naoVazio(projeto.dataSoli)) {
                        checkSoli = 'checked'
                    }
                    if (naoVazio(projeto.dataApro)) {
                        checkApro = 'checked'
                    }
                    if (naoVazio(projeto.dataTroca)) {
                        checkTroca = 'checked'
                    }
                    //console.log('lista_proposta=>' + lista_proposta)
                    res.render('principal/projeto', { checkAuth, checkPay, vendedor, lista_proposta, orcamentista, funpro, funges, ehMaster, proandges, pedido, projeto, instaladores, cliente_projeto, checkPost, checkSoli, checkApro, checkTroca, dtfim })
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar o cliente da proposta<projeto>.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o pedido<equipe>.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o projeto<projeto>.')
            res.redirect('/dashboard')
        })
    })
});

router.get('/vermais/', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var dia01 = []
    var dia02 = []
    var dia03 = []
    var dia04 = []
    var dia05 = []
    var dia06 = []
    var dia07 = []
    var dia08 = []
    var dia09 = []
    var dia10 = []
    var dia11 = []
    var dia12 = []
    var dia13 = []
    var dia14 = []
    var dia15 = []
    var dia16 = []
    var dia17 = []
    var dia18 = []
    var dia19 = []
    var dia20 = []
    var dia21 = []
    var dia22 = []
    var dia23 = []
    var dia24 = []
    var dia25 = []
    var dia26 = []
    var dia27 = []
    var dia28 = []
    var dia29 = []
    var dia30 = []
    var dia31 = []
    var params_dia = []
    var todasCores = []

    const cores = ['green', 'blue', 'tomato', 'teal', 'sienna', 'salmon', 'mediumpurple', 'rebeccapurple', 'yellowgreen', 'peru', 'cadetblue', 'coral', 'cornflowerblue', 'crimson', 'darkblue', 'darkcyan', 'orange', 'hotpink']

    var dtcadastro = '00000000'
    var dtinicio = ''
    var q = 0
    var anoinicio
    var anofim
    var mesinicio
    var mesfim
    var diainicio
    var diafim
    var hoje
    var meshoje
    var mestitulo
    var anotitulo
    var dia
    var mes
    var dif
    var difmes
    var y = 0
    var x = -1
    var z = -1
    var inicio
    var fim
    var con1
    var con2
    var data1
    var data2
    var days
    var dif1

    var janeiro
    var fevereiro
    var marco
    var abril
    var maio
    var junho
    var julho
    var agosto
    var setembro
    var outubro
    var novembro
    var dezembro

    var hoje = dataHoje()
    var meshoje = hoje.substring(5, 7)
    var anotitulo = hoje.substring(0, 4)

    //console.log('meshoje=>' + meshoje)

    switch (meshoje) {
        case '01': janeiro = 'active'
            mestitulo = 'Janeiro '
            break;
        case '02': fevereiro = 'active'
            mestitulo = 'Fevereiro '
            break;
        case '03': marco = 'active'
            mestitulo = 'Março '
            break;
        case '04': abril = 'active'
            mestitulo = 'Abril '
            break;
        case '05': maio = 'active'
            mestitulo = 'Maio '
            break;
        case '06': junho = 'active'
            mestitulo = 'Junho '
            break;
        case '07': julho = 'active'
            mestitulo = 'Julho '
            break;
        case '08': agosto = 'active'
            mestitulo = 'Agosto '
            break;
        case '09': setembro = 'active'
            mestitulo = 'Setembro '
            break;
        case '10': outubro = 'active'
            mestitulo = 'Outubro '
            break;
        case '11': novembro = 'active'
            mestitulo = 'Novembro '
            break;
        case '12': dezembro = 'active'
            mestitulo = 'Dezembro '
            break;
    }
    dataini = String(anotitulo) + meshoje + '01'
    datafim = String(anotitulo) + meshoje + '30'
    dataini = parseFloat(dataini)
    datafim = parseFloat(datafim)

    var sql = {}
    sql = { user: id, feito: true, liberar: true, prjfeito: false, tarefa: { $exists: false }, nome_projeto: { $exists: true }, $or: [{ 'dtinibusca': { $lte: datafim, $gte: dataini } }, { 'dtfimbusca': { $lte: datafim, $gte: dataini } }] }
    Pessoa.find({ user: id, funins: 'checked' }).lean().then((pessoa) => {
        Equipe.find(sql).then((equipe) => {
            equipe.forEach((e) => {
                Pessoa.findOne({ _id: e.insres }).then((tecnico) => {
                    q++
                    inicio = e.dtinicio
                    fim = e.dtfim
                    anoinicio = inicio.substring(0, 4)
                    anofim = fim.substring(0, 4)
                    mesinicio = inicio.substring(5, 7)
                    mesfim = fim.substring(5, 7)
                    diainicio = inicio.substring(8, 11)
                    diafim = fim.substring(8, 11)
                    con1 = String(mesinicio) + String(diainicio)
                    con2 = String(mesfim) + String(diafim)
                    dif1 = parseFloat(con2) - parseFloat(con1) + 1

                    if (meshoje == mesinicio) {
                        if (parseFloat(anotitulo) == parseFloat(anoinicio)) {
                            mes = meshoje
                            if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                //console.log('projeto ultrapassa anos')
                                dia = diainicio
                                if (meshoje == 1 || meshoje == 3 || meshoje == 5 || meshoje == 7 || meshoje == 8 || meshoje == 10 || meshoje == 12) {
                                    dif = 31
                                } else {
                                    dif = 30
                                }
                            } else {
                                if (mesfim > mesinicio) {
                                    data1 = new Date(anofim + '-' + mesfim + '-' + '31')
                                    data2 = new Date(inicio)
                                    dif = Math.abs(data1.getTime() - data2.getTime())
                                    days = Math.ceil(dif / (1000 * 60 * 60 * 24))
                                    if (data1.getTime() < data2.getTime()) {
                                        days = days * -1
                                    }
                                    //console.log('days=>' + days)
                                    dia = diainicio
                                    dif = days + 1
                                } else {
                                    dia = diainicio
                                    dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                    //console.log('dia=>' + dia)
                                    //console.log('dif=>' + dif)
                                }
                            }
                        } else {
                            //console.log('anos diferente')
                            dia = 0
                            dif = 0
                        }
                    } else {
                        //console.log('diferente')
                        difmes = parseFloat(mesfim) - parseFloat(mesinicio) + 1
                        //console.log('difmes=>' + difmes)
                        if (difmes != 0) {
                            //console.log('difmes=>' + difmes)
                            if (difmes < 0) {
                                difmes = difmes + 12
                            }
                            //console.log('mesinicio=>' + mesinicio)
                            for (i = 0; i < difmes; i++) {
                                mes = parseFloat(mesinicio) + i
                                if (mes > 12) {
                                    mes = mes - 12
                                }
                                //console.log('mes=>' + mes)
                                //console.log('meshoje=>' + meshoje)
                                if (mes == meshoje) {
                                    if (mes < 10) {
                                        mes = '0' + mes
                                        dia = '01'
                                    }
                                    break;
                                }
                            }
                            if (anotitulo == anofim) {
                                if (mes == mesfim) {
                                    dif = parseFloat(diafim)
                                } else {
                                    if (meshoje == 1 || meshoje == 3 || meshoje == 5 || meshoje == 7 || meshoje == 8 || meshoje == 10 || meshoje == 12) {
                                        dif = 31
                                    } else {
                                        dif = 30
                                    }
                                }
                            } else {
                                dia = 0
                                dif = 0
                            }
                        } else {
                            dif = 0
                            dia = 0
                        }
                    }

                    y = Math.floor(Math.random() * 17)
                    if (y == x) {
                        y = Math.floor(Math.random() * 17)
                    } else {
                        if (y == z) {
                            y = Math.floor(Math.random() * 17)
                        }
                    }
                    x = y
                    z = y

                    color = cores[y]

                    todasCores.push({ color })

                    for (i = 0; i < dif; i++) {
                        //console.log('dia=>' + dia)
                        //console.log('entrou laço')    
                        params_dia = { id: tecnico._id, tecnico: tecnico.nome, cor: color, instalador: 'true' }
                        if (meshoje == mes) {
                            switch (String(dia)) {
                                case '01':
                                    dia01.push(params_dia)
                                    break;
                                case '02':
                                    dia02.push(params_dia)
                                    break;
                                case '03':
                                    dia03.push(params_dia)
                                    break;
                                case '04':
                                    dia04.push(params_dia)
                                    break;
                                case '05':
                                    dia05.push(params_dia)
                                    break;
                                case '06':
                                    dia06.push(params_dia)
                                    break;
                                case '07':
                                    dia07.push(params_dia)
                                    break;
                                case '08':
                                    dia08.push(params_dia)
                                    break;
                                case '09':
                                    dia09.push(params_dia)
                                    break;
                                case '10':
                                    dia10.push(params_dia)
                                    break;
                                case '11':
                                    dia11.push(params_dia)
                                    break;
                                case '12':
                                    dia12.push(params_dia)
                                    break;
                                case '13':
                                    dia13.push(params_dia)
                                    break;
                                case '14':
                                    dia14.push(params_dia)
                                    break;
                                case '15':
                                    dia15.push(params_dia)
                                    break;
                                case '16':
                                    dia16.push(params_dia)
                                    break;
                                case '17':
                                    dia17.push(params_dia)
                                    break;
                                case '18':
                                    dia18.push(params_dia)
                                    break;
                                case '19':
                                    dia19.push(params_dia)
                                    break;
                                case '20':
                                    dia20.push(params_dia)
                                    break;
                                case '21':
                                    dia21.push(params_dia)
                                    break;
                                case '22':
                                    dia22.push(params_dia)
                                    break;
                                case '23':
                                    dia23.push(params_dia)
                                    break;
                                case '24':
                                    dia24.push(params_dia)
                                    break;
                                case '25':
                                    dia25.push(params_dia)
                                    break;
                                case '26':
                                    dia26.push(params_dia)
                                    break;
                                case '27':
                                    dia27.push(params_dia)
                                    break;
                                case '28':
                                    dia28.push(params_dia)
                                    break;
                                case '29':
                                    dia29.push(params_dia)
                                    break;
                                case '30':
                                    dia30.push(params_dia)
                                    break;
                                case '31':
                                    dia31.push(params_dia)
                                    break;
                            }
                            dia++
                            if (dia < 10) {
                                dia = '0' + dia
                            }
                            //console.log('dia=>' + dia)
                        }
                    }

                    if (q == equipe.length) {
                        res.render('principal/agenda', {
                            dia01, dia02, dia03, dia04, dia05, dia06, dia07, dia08, dia09, dia10,
                            dia11, dia12, dia13, dia14, dia15, dia16, dia17, dia18, dia19, dia20,
                            dia21, dia22, dia23, dia24, dia25, dia26, dia27, dia28, dia29, dia30, dia31, pessoa,
                            mestitulo, meshoje, anotitulo, todasCores, dataini, datafim, ehinstalador: true,
                            janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro
                        })
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontra o instalador.')
                    res.redirect('/dashboard')
                })
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontra a equipe.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontra a pessoa.')
        res.redirect('/dashboard')
    })
});

module.exports = router;