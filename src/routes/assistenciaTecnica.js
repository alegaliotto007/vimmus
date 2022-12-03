require('../model/Usina');
require('../model/Projeto');
require('../model/Empresa');
require('../model/Cliente');
require('../model/Tarefas');
require('../model/Equipe');
require('../model/Servico');

const { ehAdmin } = require('../helpers/ehAdmin');

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Empresa = mongoose.model('empresa');
const Cliente = mongoose.model('cliente');
const Usina = mongoose.model('usina');
const Pessoa = mongoose.model('pessoa');
const Tarefas = mongoose.model('tarefas');
const Equipe = mongoose.model('equipe');
const Projeto = mongoose.model('projeto');
const Servico = mongoose.model('servico');

const dataBusca = require('../resources/dataBusca');
const dataMensagem = require('../resources/dataMensagem');
const dataHoje = require('../resources/dataHoje');
const naoVazio = require('../resources/naoVazio');
const comparaNum = require('../resources/comparaNumeros');
const buscaPrimeira = require('../resources/buscaPrimeira');

router.get('/assistencia', ehAdmin, (req, res) => {
    const { pessoa } = req.user
    var q = 0
    var lista = []
    //console.log('pessoa=>' + pessoa)
    Tarefas.find({ responsavel: pessoa, tipo: 'assistencia', concluido: false }).then((tarefa) => {
        //console.log('tarefa=>' + tarefa)
        if (naoVazio(tarefa)) {
            tarefa.forEach((e) => {
                Servico.findOne({ _id: e.servico }).then((servico) => {
                    q++
                    lista.push({ id: e._id, seq: e.seq, observacao: e.observacao, selecionado: e.selecionado, descricao: servico.descricao, data: dataMensagem(e.dataini), endereco: e.endereco, numero: e.numero, complemento: e.complemento, uf: e.uf, cidade: e.cidade })
                    //console.log('q=>' + q)
                    //console.log('tarefa.length=>' + tarefa.length)
                    if (q == tarefa.length) {
                        lista.sort(comparaNum)
                        res.render('principal/assistencia', { lista })
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Nenhuma serviço encontrado.')
                    res.redirect('/cliente/consulta')
                })
            })
        } else {
            res.render('principal/assistencia')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Nenhuma tarefa encontrada.')
        res.redirect('/dashboard')
    })
});

router.get('/tarefa/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var trf_empresa
    var trf_empid
    var trf_servico
    var trf_srvid
    var trf_dataini

    //console.log('req.params.id=>' + req.params.id)
    Tarefas.findOne({ _id: req.params.id }).lean().then((tarefa) => {
        trf_dataini = dataMensagem(tarefa.dataini)
        Empresa.findOne({ _id: tarefa.empresa }).lean().then((trfemp) => {
            trf_empresa = trfemp.nome
            trf_empid = trfemp._id
            Servico.findOne({ _id: tarefa.servico }).then((trfsrv) => {
                trf_servico = trfsrv.descricao
                trf_srvid = trfsrv._id
                Equipe.findOne({ _id: tarefa.equipe }).then((equipeins) => {
                    Cliente.findOne({ _id: tarefa.cliente }).lean().then((trf_cliente) => {
                        if (naoVazio(equipeins)) {
                            Empresa.find({ user: id }).lean().then((empresa) => {
                                Cliente.find({ user: id }).lean().then((cliente) => {
                                    //console.log('req.body.cliente=>' + req.body.cliente)
                                    Servico.find({ user: id }).lean().then((servicos) => {
                                        Pessoa.find({ user: id, 'funass': 'checked' }).lean().then((assistencia) => {
                                            if (naoVazio(assistencia)) {
                                                //console.log('tarefa.responsavel=>' + tarefa.responsavel)
                                                Pessoa.findOne({ _id: tarefa.responsavel }).lean().then((trf_tecnico) => {
                                                    //console.log('trf_tecnico=>' + trf_tecnico)
                                                    if (naoVazio(trf_tecnico)) {
                                                        res.render('principal/tarefas', { tarefa, trf_empresa, trf_empid, trfemp, trf_tecnico, assistencia, trf_servico, trf_srvid, trf_cliente, cliente, servicos, empresa })
                                                    } else {
                                                        res.render('principal/tarefas', { tarefa, trf_empresa, trf_empid, trfemp, trf_servico, assistencia, trf_srvid, trf_cliente, cliente, servicos, empresa })
                                                    }
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Nenhuma responsavel pela tarefa encontrado.')
                                                    res.redirect('/gerenciamento/agenda')
                                                })
                                            } else {
                                                req.flash('error_msg', 'Nenhuma técnico cadastrado.')
                                                res.redirect('/pessoa/novo')
                                            }
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Nenhuma responsavel pela tarefa encontrado.')
                                            res.redirect('/gerenciamento/agenda')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Nenhuma tipo de serviço cadastrado.')
                                        res.redirect('/gerenciamento/agenda')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar o cliente.')
                                    res.redirect('/gerenciamento/orcamento/' + req.params.id)
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Nehuam empresa cadastrada.')
                                res.redirect('/confguracao/addempresa')
                            })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar o cliente da tarefa.')
                        res.redirect('/gerenciamento/orcamento/' + req.params.id)
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a equipe.')
                    res.redirect('/gerenciamento/orcamento/' + req.params.id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Nenhum tipo de serviço encontrado.')
                res.redirect('/cliente/consulta')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhuma empresa encontrada.')
            res.redirect('/cliente/consulta')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhuma tarefa encontrada.')
        res.redirect('/cliente/consulta')
    })
});

router.post('/addmanutencao', ehAdmin, (req, res) => {
    var id
    const { _id } = req.user
    const { user } = req.user
    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    var data = ''
    var dia = ''
    var ano = ''
    var ins_fora = []
    var q = 0
    var ehSelecao = false
    var mes = ''

    var hoje = req.body.date
    ano = String(hoje).substring(0, 4)
    mes = String(hoje).substring(5, 7)
    dia = String(hoje).substring(8, 10)
    if (parseFloat(dia) < 10) {
        dia = '0' + dia
    }

    var nome
    var id
    var idcliente
    data = req.body.data
    //console.log('data=>' + data)
    Empresa.findOne({ user: id }).lean().then((trfemp) => {
        if (naoVazio(trfemp)) {
            //console.log('req.body.cliente=>' + req.body.cliente)
            Servico.find({ user: id }).lean().then((servicos) => {
                if (naoVazio(servicos)) {
                    //console.log('check=>' + req.body.check)
                    if (req.body.check != 'on') {
                        idcliente = '111111111111111111111111'
                    } else {
                        idcliente = req.body.cliente
                    }
                    //console.log('idcliente=>' + idcliente)
                    Usina.find({ cliente: idcliente }).lean().then((usina) => {
                        //console.log('usina=>' + usina)
                        if (naoVazio(usina)) {
                            //console.log(usina)
                            Pessoa.find({ user: id, $or: [{ 'funins': 'checked' }, { 'funele': 'checked' }] }).sort({ 'nome': 'asc' }).lean().then((instalacao) => {
                                if (naoVazio(instalacao)) {
                                    instalacao.forEach((pesins) => {
                                        q++
                                        nome = pesins.nome
                                        ins_fora.push({ id: pesins._id, nome })
                                        if (q == instalacao.length) {
                                            Pessoa.find({ user: id, 'funges': 'checked' }).sort({ 'nome': 'asc' }).lean().then((gestor) => {
                                                //console.log('gestor=>' + gestor)
                                                res.render('principal/tarefas', { data, usina, ins_fora, servicos, cliente: idcliente, instalacao, gestor, empresa })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao encontrar os gestores.')
                                                res.redirect('/gerenciamento/agenda')
                                            })
                                        }
                                    })
                                } else {
                                    req.flash('error_msg', 'Não existem técnicos cadastrados.')
                                    res.redirect('/gerenciamento/agenda')
                                }
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar os técnicos.')
                                res.redirect('/gerenciamento/agenda')
                            })
                        } else {
                            //console.log('sem usina')
                            // Pessoa.find({ user: id, 'funins': 'checked' }).sort({ 'nome': 'asc' }).lean().then((instalacao) => {
                            //     if (naoVazio(instalacao)) {
                            //         instalacao.forEach((pesins) => {
                            //             q++
                            //             nome = pesins.nome
                            //             ins_fora.push({ id: pesins._id, nome })
                            //             if (q == instalacao.length) {
                            //                 //console.log('id=>' + id)
                            Cliente.find({ user: id }).lean().then((cliente) => {
                                Pessoa.find({ user: id, 'funges': 'checked' }).sort({ 'nome': 'asc' }).lean().then((gestor) => {
                                    Pessoa.find({ user: id, 'funass': 'checked' }).lean().then((assistencia) => {
                                        if (naoVazio(assistencia)) {
                                            res.render('principal/tarefas', { data, servicos, cliente, gestor, trfemp, assistencia })
                                        } else {
                                            req.flash('error_msg', 'Nenhuma técnico cadstrado.')
                                            res.redirect('/pessoa/novo')
                                        }
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar as pessoas.')
                                        res.redirect('/gerenciamento/agenda')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar os gestores.')
                                    res.redirect('/gerenciamento/agenda')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar o cliente.')
                                res.redirect('/gerenciamento/agenda')
                            })
                            //         }
                            //     })
                            // } else {
                            //     req.flash('error_msg', 'Não existem técnicos cadastrados.')
                            //     res.redirect('/gerenciamento/agenda')
                            // }
                            // }).catch((err) => {
                            //     req.flash('error_msg', 'Falha ao encontrar os técnicos.')
                            //     res.redirect('/gerenciamento/agenda')
                            // })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Nenhuma usina cadastrada.')
                        res.redirect('/gerenciamento/agenda')
                    })
                } else {
                    req.flash('error_msg', 'Não existem serviços cadastradas.')
                    res.redirect('/gerenciamento/agenda')
                }
            }).catch((err) => {
                req.flash('error_msg', 'Nenhuma tipo de serviço cadastrado.')
                res.redirect('/gerenciamento/agenda')
            })
        } else {
            req.flash('error_msg', 'Cadastre uma empresa para continuar.')
            res.redirect('/confguracao/addempresa')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Nenhuma empresa cadastrada.')
        res.redirect('/confguracao/addempresa')
    })
});

router.post('/addtarefa', ehAdmin, (req, res) => {
    var id
    const { _id } = req.user
    const { user } = req.user
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var adiciona
    var dataini
    var datafim
    var dif
    var dias = []
    var cadastro = dataHoje()
    var corpo = []
    var email = []
    var todos_emails = ''
    var equipe = []
    var email = ''

    var cep = ''
    var cidade = ''
    var uf = ''
    var endereco = ''
    var numero = ''
    var bairro = ''
    var complemento = ''

    //console.log('req.body.id=>' + req.body.id)
    if (naoVazio(req.body.id)) {
        Tarefas.findOne({ _id: req.body.id }).then((tarefa) => {
            //console.log('equipe=>' + tarefa.equipe)
            Equipe.findOne({ _id: tarefa.equipe }).then((equipe) => {
                //console.log('equipe=>' + equipe)
                dataini = req.body.dataini
                datafim = req.body.datafim
                //console.log('req.body.checkres=>' + req.body.checkres)
                //console.log('dataini=>' + dataini)
                //console.log('datafim=>' + datafim)

                if (naoVazio(dataini) && naoVazio(datafim)) {
                    var data1 = new Date(dataini)
                    var data2 = new Date(datafim)
                    dif = Math.abs(data2.getTime() - data1.getTime())
                    days = Math.ceil(dif / (1000 * 60 * 60 * 24))
                    days = days + 1
                    //console.log('days=>' + days)
                    for (i = 1; i < days + 1; i++) {
                        dias.push({ dia: i, feito: false })
                    }
                    tarefa.dias = dias
                }
                tarefa.cliente = req.body.cliente
                tarefa.observacao = req.body.observacao
                tarefa.endereco = buscaPrimeira(req.body.endereco)
                tarefa.numero = req.body.numero
                tarefa.bairro = req.body.bairro
                tarefa.cep = req.body.cep
                tarefa.complemento = req.body.complemento
                tarefa.cidade = req.body.cidade
                tarefa.uf = req.body.uf
                //console.log('req.body.manutencao=>' + req.body.manutencao)
                tarefa.servico = req.body.manutencao
                tarefa.dataini = dataini
                tarefa.buscadataini = dataBusca(dataini)
                // tarefa.datafim = datafim
                // tarefa.buscadatafim = dataBusca(datafim)
                tarefa.preco = req.body.preco
                if (req.body.checkres != null) {
                    tarefa.responsavel = req.body.responsavel
                }
                tarefa.save().then(() => {
                    // equipe.ins0 = req.body.ins0
                    // equipe.ins1 = req.body.ins1
                    // equipe.ins2 = req.body.ins2
                    // equipe.ins3 = req.body.ins3
                    // equipe.ins4 = req.body.ins4
                    // equipe.ins5 = req.body.ins5
                    //console.log('tarefa salva')
                    if (req.body.checkres != null) {
                        equipe.insres = req.body.responsavel
                    }
                    equipe.dtinicio = req.body.dataini
                    // equipe.dtfim = req.body.datafim
                    equipe.dtinibusca = dataBusca(req.body.dataini)
                    // equipe.dtfimbusca = dataBusca(req.body.datafim)
                    equipe.save().then(() => {
                        req.flash('success_msg', 'Tarefa salva com sucesso.')
                        if (naoVazio(tarefa.programacao)) {
                            res.redirect('/cliente/programacao/' + req.body.idusina)
                        } else {
                            res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve erro ao salvar a equipe.')
                        res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Houve erro ao salvar a tarefa.')
                    res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Houve erro ao encontrar a equipe.')
                res.redirect('/gerenciamento/tarefa/' + tarefa._id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve erro ao encontrar a projeto.')
            res.redirect('/gerenciamento/tarefa/' + tarefa._id)
        })
    } else {
        //console.log('equipe true')
        dataini = req.body.dataini
        // datafim = req.body.datafim
        //console.log('email=>' + email)
        for (i = 0; i < email.length; i++) {
            //console.log('custoins[i]' + custoins[i])
            todos_emails = todos_emails + email[i] + ';'
        }
        //console.log('req.body.ins0=>' + req.body.ins0)
        corpo = {
            user: id,
            inres: req.body.responsavel,
            dtinicio: req.body.dataini,
            // dtfim: req.body.datafim,
            dtinibusca: dataBusca(req.body.dataini),
            // dtfimbusca: dataBusca(req.body.datafim),
            feito: false,
            liberar: false,
            parado: false,
            //email: todos_emails
        }

        if (req.body.checkres != null) {
            Object.assign(equipe, { insres: req.body.responsavel }, corpo)
        } else {
            equipe = corpo
        }

        new Equipe(equipe).save().then(() => {
            //console.log('salvou equipe')
            Equipe.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novaequipe) => {
                Empresa.findOne({ _id: req.body.empresa }).then((emp_tarefa) => {
                    //console.log('encontrou empresa')
                    //console.log('req.body.cliente=>' + req.body.cliente)
                    Cliente.findOne({ _id: req.body.cliente }).then((cliente) => {
                        //console.log("dias=>" + dias)
                        if (naoVazio(req.body.cep)) {
                            cep = req.body.cep
                        } else {
                            cep = cliente.cep
                        }
                        if (naoVazio(req.body.cidade)) {
                            cidade = req.body.cidade
                        } else {
                            cidade = cliente.cidade
                        }
                        if (naoVazio(req.body.uf)) {
                            uf = req.body.uf
                        } else {
                            uf = cliente.uf
                        }
                        if (naoVazio(req.body.endereco)) {
                            endereco = req.body.endereco
                        } else {
                            endereco = cliente.endereco
                        }
                        if (naoVazio(req.body.numero)) {
                            numero = req.body.numero
                        } else {
                            numero = cliente.numero
                        }
                        if (naoVazio(req.body.bairro)) {
                            bairro = req.body.bairro
                        } else {
                            bairro = cliente.bairro
                        }
                        if (naoVazio(req.body.complemento)) {
                            complemento = req.body.complemento
                        } else {
                            complemento = cliente.complemento
                        }
                        corpo = {
                            user: id,
                            equipe: novaequipe._id,
                            cliente: req.body.cliente,
                            observacao: req.body.observacao,
                            empresa: req.body.empresa,
                            endereco: endereco,
                            numero: numero,
                            bairro: bairro,
                            cep: cep,
                            complemento: complemento,
                            cidade: cidade,
                            uf: uf,
                            servico: req.body.manutencao,
                            dataini: dataini,
                            buscadataini: dataBusca(dataini),
                            cadastro: dataBusca(cadastro),
                            preco: req.body.preco,
                            concluido: false,
                            selecionado: false,
                            tipo: 'assistencia',
                            emandamento: false
                        }
                        var tarefa = []
                        //console.log('req.body.responsavel=>' + req.body.responsavel)
                        if (naoVazio(req.body.responsavel)) {
                            //console.log('tarefa=>' + JSON.stringify(corpo))
                            Object.assign(tarefa, { responsavel: req.body.responsavel }, corpo)
                        } else {
                            tarefa = corpo
                        }
                        //console.log('tarefa=>' + JSON.stringify(tarefa))
                        var seq
                        Tarefas.findOne({ user: id, tipo: 'assistencia' }).sort({ field: 'asc', _id: -1 }).then((tarefa_seq) => {
                            //console.log('tarefa_seq=>' + JSON.stringify(tarefa_seq))
                            if (naoVazio(tarefa_seq)) {
                                seq = tarefa_seq.seq + 1
                            } else {
                                seq = 1
                            }
                            new Tarefas(tarefa).save().then(() => {
                                //console.log("salvou tarefa")
                                Tarefas.findOne({ user: id, tipo: 'assistencia' }).sort({ field: 'asc', _id: -1 }).then((tarefa) => {
                                    emp_tarefa.save().then(() => {
                                        //console.log('novaequipe._id=>' + novaequipe._id)
                                        //console.log(tarefa._id)
                                        novaequipe.tarefa = tarefa._id
                                        novaequipe.save().then(() => {
                                            tarefa.seq = seq
                                            tarefa.save().then(() => {
                                                req.flash('success_msg', 'Tarefa gerada com sucesso.')
                                                res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao salvar a tarefa.')
                                                res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                                            })
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao salvar a empresa.')
                                        res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar a tarefa.')
                                    res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao salvar a tarefa.')
                                res.redirect('/gerenciamento/tarefa' + tarefa._id)
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar a última tarefa.')
                            res.redirect('/gerenciamento/agenda')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar o cliente.')
                        res.redirect('/gerenciamento/tarefa' + tarefa._id)
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a empresa.')
                    res.redirect('/gerenciamento/tarefa/' + tarefa._id)
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar a equipe.')
                res.redirect('/gerenciamento/tarefa/' + tarefa._id)
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao salvar a equipe.')
            res.redirect('/gerenciamento/tarefa/' + tarefa._id)
        })
    }
});

router.post('/aplicarTarefas/', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    var dia

    var mes
    var dif
    var difmes
    var dtinicio
    var dtfim
    var anoinicio
    var anofim
    var mesinicio
    var mesfim
    var diainicio
    var diafim

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

    var janeiro = ''
    var fevereiro = ''
    var marco = ''
    var abril = ''
    var maio = ''
    var junho = ''
    var julho = ''
    var agosto = ''
    var setembro = ''
    var outubro = ''
    var novembro = ''
    var dezembro = ''

    var dia
    var mestitulo
    var messel
    var mes
    var q = 0
    var ano = req.body.ano

    var tarefa
    var sql

    switch (String(req.body.mes)) {
        case 'Janeiro':
            janeiro = 'active'
            mestitulo = 'Janeiro '
            messel = '01'
            break;
        case 'Fevereiro':
            fevereiro = 'active'
            mestitulo = 'Fevereiro '
            messel = '02'
            break;
        case 'Março':
            marco = 'active'
            mestitulo = 'Março '
            messel = '03'
            break;
        case 'Abril':
            abril = 'active'
            mestitulo = 'Abril '
            messel = '04'
            break;
        case 'Maio':
            maio = 'active'
            mestitulo = 'Maio '
            messel = '05'
            break;
        case 'Junho':
            junho = 'active'
            mestitulo = 'Junho '
            messel = '06'
            break;
        case 'Julho':
            julho = 'active'
            mestitulo = 'Julho '
            messel = '07'
            break;
        case 'Agosto':
            agosto = 'active'
            mestitulo = 'Agosto '
            messel = '08'
            break;
        case 'Setembro':
            setembro = 'active'
            mestitulo = 'Setembro '
            messel = '09'
            break;
        case 'Outubro':
            outubro = 'active'
            mestitulo = 'Outubro '
            messel = '10'
            break;
        case 'Novembro':
            novembro = 'active'
            mestitulo = 'Novembro '
            messel = '11'
            break;
        case 'Dezembro':
            dezembro = 'active'
            mestitulo = 'Dezembro '
            messel = '12'
            break;
    }
    //console.log('req.body.selecionado=>' + req.body.selecionado)
    dataini = ano + '01' + '01'
    datafim = ano + '12' + '31'
    //console.log('dataini=>' + dataini)
    //console.log('datafim=>' + datafim)
    //console.log('req.body.pessoa=>' + req.body.pessoa)
    if (naoVazio(req.body.pessoa)) {
        //console.log('entrou')
        Pessoa.findOne({ user: id, _id: req.body.pessoa }).lean().then((pessoa) => {
            //console.log('pessoa=>' + pessoa)
            Tarefas.find({ user: id, servico: { $exists: true }, 'buscadataini': { $lte: parseFloat(datafim), $gte: parseFloat(dataini) } }).then((lista_tarefas) => {
                //console.log('tarefas=>' + tarefas)
                if (naoVazio(lista_tarefas)) {
                    lista_tarefas.forEach((e) => {
                        //console.log('e._id=>' + e._id)
                        Equipe.findOne({ user: id, id: e.equipe, ins0: { $exists: true }, dtinicio: { $ne: '00/00/0000' }, $or: [{ ins0: pessoa.nome }, { ins1: pessoa.nome }, { ins2: pessoa.nome }, { ins3: pessoa.nome }, { ins4: pessoa.nome }, { ins5: pessoa.nome }] }).then((equipe) => {
                            //console.log('e._id=>' + e._id)
                            Cliente.findOne({ _id: e.cliente }).then((cliente) => {
                                //console.log('cliente.nome=>' + cliente.nome)
                                //console.log('e.servico=>' + e.servico)
                                Servico.findOne({ _id: e.servico }).then((ser) => {
                                    //console.log('ser.descricao=>' + ser.descricao)
                                    var dias = []
                                    var feito = false
                                    dias = e.dias
                                    q++
                                    dtinicio = e.dataini
                                    //dtfim = e.datafim
                                    anoinicio = dtinicio.substring(0, 4)
                                    anofim = dtinicio.substring(0, 4)
                                    mesinicio = dtinicio.substring(5, 7)
                                    mesfim = dtinicio.substring(5, 7)
                                    diainicio = dtinicio.substring(8, 11)
                                    diafim = dtinicio.substring(8, 11)
                                    //console.log("messel=>" + messel)
                                    //console.log("mesinicio=>" + mesinicio)
                                    if (messel == mesinicio) {
                                        mes = mesinicio
                                        if (parseFloat(anofim) == parseFloat(anoinicio)) {
                                            dia = diainicio
                                            if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                                //console.log('projeto ultrapassa anos')
                                                if (messel == 1 || messel == 3 || messel == 5 || messel == 7 || messel == 8 || messel == 10 || messel == 12) {
                                                    dif = 31
                                                } else {
                                                    dif = 30
                                                }
                                            } else {
                                                if (naoVazio(e.programacao)) {
                                                    dif = 1
                                                } else {
                                                    dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                                }
                                            }
                                        } else {
                                            //console.log('mesmo mes outro ano')
                                            //console.log('diainicio=>' + diainicio)
                                            if (naoVazio(e.programacao)) {
                                                dia = diainicio
                                                dif = 1
                                            } else {
                                                dif =
                                                    dia = 0
                                            }
                                        }
                                    } else {
                                        //console.log('diferente')
                                        if (naoVazio(e.programacao)) {
                                            dia = diainicio
                                            dif = 1
                                        } else {
                                            difmes = parseFloat(mesfim) - parseFloat(mesinicio)
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
                                                    if (mes == messel) {
                                                        break;
                                                    }
                                                }
                                                if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                                    dia = '01'
                                                    if (messel == 1 || messel == 3 || messel == 5 || messel == 7 || messel == 8 || messel == 10 || messel == 12) {
                                                        dif = 31
                                                    } else {
                                                        dif = 30
                                                    }

                                                } else {
                                                    dia = diainicio
                                                    if (naoVazio(e.programacao)) {
                                                        dif = 1
                                                    } else {
                                                        dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    //console.log('dataini=>' + dataini)
                                    //console.log('mes=>' + mes)
                                    tarefa = ser.descricao
                                    for (i = 0; i < dif; i++) {
                                        //console.log('dia=>' + dia)
                                        //console.log('entrou laço')
                                        cor = 'lightgray'
                                        sql = { cliente: cliente.nome, id: e._id, tarefa, cor, concluido: e.concluido }
                                        if (messel == mes) {
                                            if (naoVazio(dias)) {
                                                //console.log('d=>' + d)
                                                feito = dias[i].feito
                                                //console.log('feito=>' + feito)
                                            }
                                            if (dia == '01') {
                                                dia01.push(sql)
                                            }
                                            if (dia == '02') {
                                                dia02.push(sql)
                                            }
                                            if (dia == '03') {
                                                dia03.push(sql)
                                            }
                                            if (dia == '04') {
                                                dia04.push(sql)
                                            }
                                            if (dia == '05') {
                                                dia05.push(sql)
                                            }
                                            if (dia == '06') {
                                                dia06.push(sql)
                                            }
                                            if (dia == '07') {
                                                dia07.push(sql)
                                            }
                                            if (dia == '08') {
                                                dia08.push(sql)
                                            }
                                            if (dia == '09') {
                                                dia09.push(sql)
                                            }
                                            if (dia == '10') {
                                                dia10.push(sql)
                                            }
                                            if (dia == '11') {
                                                dia11.push(sql)
                                            }
                                            if (dia == '12') {
                                                dia12.push(sql)
                                            }
                                            if (dia == '13') {
                                                dia13.push(sql)
                                            }
                                            if (dia == '14') {
                                                dia14.push(sql)
                                            }
                                            if (dia == '15') {
                                                dia15.push(sql)
                                            }
                                            if (dia == '16') {
                                                dia16.push(sql)
                                            }
                                            if (dia == '17') {
                                                dia17.push(sql)
                                            }
                                            if (dia == '18') {
                                                dia18.push(sql)
                                            }
                                            if (dia == '19') {
                                                dia19.push(sql)
                                            }
                                            if (dia == '20') {
                                                dia20.push(sql)
                                            }
                                            if (dia == '21') {
                                                dia21.push(sql)
                                            }
                                            if (dia == '22') {
                                                dia22.push(sql)
                                            }
                                            if (dia == '23') {
                                                dia23.push(sql)
                                            }
                                            if (dia == '24') {
                                                dia24.push(sql)
                                            }
                                            if (dia == '25') {
                                                dia25.push(sql)
                                            }
                                            if (dia == '26') {
                                                dia26.push(sql)
                                            }
                                            if (dia == '27') {
                                                dia27.push(sql)
                                            }
                                            if (dia == '28') {
                                                dia28.push(sql)
                                            }
                                            if (dia == '29') {
                                                dia29.push(sql)
                                            }
                                            if (dia == '30') {
                                                dia30.push(sql)
                                            }
                                            if (dia == '31') {
                                                dia31.push(sql)
                                            }
                                        }
                                        dia++
                                    }
                                    //console.log('tarefas.length=>' + tarefas.length)
                                    if (q == tarefas.length) {
                                        //console.log('messel=>' + messel)
                                        //console.log('ano=>' + ano)
                                        //console.log('mestitulo=>' + mestitulo)
                                        res.render('principal/agenda', {
                                            dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                                            dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                                            dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                                            dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                                            dia29, dia30, dia31,
                                            mes, anotitulo: ano, meshoje: messel, mestitulo, janeiro, fevereiro, marco, abril, maio, junho,
                                            julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true
                                        })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar o tipo de serviço.')
                                    res.redirect('/gerenciamento/agenda')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar o cliente.')
                                res.redirect('/gerenciamento/agenda')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar a todas tarefas.')
                            res.redirect('/gerenciamento/agenda')
                        })
                    })
                } else {
                    var erros = []
                    erros.push({ texto: 'Pessoa sem tarefas para este período.' })
                    res.render('principal/agenda', {
                        dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                        dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                        dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                        dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                        dia29, dia30, dia31,
                        mes, anotitulo: ano, meshoje: messel, mestitulo, janeiro, fevereiro, marco, abril, maio, junho,
                        julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true, erros
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar a todas tarefas.')
                res.redirect('/gerenciamento/agenda')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar a pessoa.')
            res.redirect('/gerenciamento/agenda')
        })
    } else {
        Cliente.find({ user: id }).lean().then((todos_clientes) => {
            //console.log("dataini=>" + dataini)
            //console.log("datafim=>" + datafim)
            Tarefas.find({ user: id, servico: { $exists: true }, 'buscadataini': { $lte: parseFloat(datafim), $gte: parseFloat(dataini) } }).then((lista_tarefas) => {
                //console.log('lista_tarefas=>' + lista_tarefas)
                if (naoVazio(lista_tarefas)) {
                    lista_tarefas.forEach((e) => {
                        //console.log('e._id=>' + e._id)
                        //console.log('e.cliente=>' + e.cliente)
                        Cliente.findOne({ _id: e.cliente }).then((cliente) => {
                            //console.log('cliente=>' + cliente)
                            //console.log('e.servico=>' + e.servico)
                            Servico.findOne({ _id: e.servico }).then((ser) => {
                                var dias = []
                                var feito = false
                                dias = e.dias
                                q++
                                dtinicio = e.dataini
                                // dtfim = e.datafim
                                anoinicio = dtinicio.substring(0, 4)
                                anofim = dtinicio.substring(0, 4)
                                mesinicio = dtinicio.substring(5, 7)
                                mesfim = dtinicio.substring(5, 7)
                                diainicio = dtinicio.substring(8, 11)
                                diafim = dtinicio.substring(8, 11)
                                //console.log('e._id=>' + e._id)
                                //console.log("messel=>" + messel)
                                //console.log("mesinicio=>" + mesinicio)

                                if (messel == mesinicio) {
                                    mes = mesinicio
                                    if (parseFloat(anofim) == parseFloat(anoinicio)) {
                                        dia = diainicio
                                        if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                            //console.log('projeto ultrapassa anos')
                                            if (messel == 1 || messel == 3 || messel == 5 || messel == 7 || messel == 8 || messel == 10 || messel == 12) {
                                                dif = 31
                                            } else {
                                                dif = 30
                                            }
                                        } else {
                                            if (naoVazio(e.programacao)) {
                                                dif = 1
                                            } else {
                                                dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                            }
                                        }
                                    } else {
                                        //console.log('mesmo mes outro ano')
                                        //console.log('diainicio=>' + diainicio)
                                        if (naoVazio(e.programacao)) {
                                            dia = diainicio
                                            dif = 1
                                        } else {
                                            dif =
                                                dia = 0
                                        }
                                    }
                                } else {
                                    //console.log('diferente')
                                    mes = 0
                                    if (naoVazio(e.programacao)) {
                                        dia = diainicio
                                        dif = 1
                                    } else {
                                        difmes = parseFloat(mesfim) - parseFloat(mesinicio)
                                        //console.log('difmes=>' + difmes)
                                        if (difmes != 0) {
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
                                                if (mes == messel) {
                                                    break;
                                                }
                                            }
                                            if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                                dia = '01'
                                                if (messel == 1 || messel == 3 || messel == 5 || messel == 7 || messel == 8 || messel == 10 || messel == 12) {
                                                    dif = 31
                                                } else {
                                                    dif = 30
                                                }
                                            } else {
                                                dia = diainicio
                                                if (naoVazio(e.programacao)) {
                                                    dif = 1
                                                } else {
                                                    dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                                }
                                            }
                                        }
                                    }
                                }

                                const { dataini } = e
                                //console.log('dataini=>' + dataini)
                                //console.log('ser.descricao=>' + ser.descricao)
                                tarefa = ser.descricao
                                for (i = 0; i < dif; i++) {
                                    //console.log('dia=>' + dia)
                                    //console.log('entrou laço')
                                    cor = 'lightgray'
                                    sql = { cliente: cliente.nome, id: e._id, tarefa, cor, concluido: e.concluido }
                                    if (messel == mes) {
                                        if (naoVazio(dias)) {
                                            //console.log('d=>' + d)
                                            feito = dias[i].feito
                                            //console.log('feito=>' + feito)
                                        }
                                        if (dia == '01') {
                                            dia01.push(sql)
                                        }
                                        if (dia == '02') {
                                            dia02.push(sql)
                                        }
                                        if (dia == '03') {
                                            dia03.push(sql)
                                        }
                                        if (dia == '04') {
                                            dia04.push(sql)
                                        }
                                        if (dia == '05') {
                                            dia05.push(sql)
                                        }
                                        if (dia == '06') {
                                            dia06.push(sql)
                                        }
                                        if (dia == '07') {
                                            dia07.push(sql)
                                        }
                                        if (dia == '08') {
                                            dia08.push(sql)
                                        }
                                        if (dia == '09') {
                                            dia09.push(sql)
                                        }
                                        if (dia == '10') {
                                            dia10.push(sql)
                                        }
                                        if (dia == '11') {
                                            dia11.push(sql)
                                        }
                                        if (dia == '12') {
                                            dia12.push(sql)
                                        }
                                        if (dia == '13') {
                                            dia13.push(sql)
                                        }
                                        if (dia == '14') {
                                            dia14.push(sql)
                                        }
                                        if (dia == '15') {
                                            dia15.push(sql)
                                        }
                                        if (dia == '16') {
                                            dia16.push(sql)
                                        }
                                        if (dia == '17') {
                                            dia17.push(sql)
                                        }
                                        if (dia == '18') {
                                            dia18.push(sql)
                                        }
                                        if (dia == '19') {
                                            dia19.push(sql)
                                        }
                                        if (dia == '20') {
                                            dia20.push(sql)
                                        }
                                        if (dia == '21') {
                                            dia21.push(sql)
                                        }
                                        if (dia == '22') {
                                            dia22.push(sql)
                                        }
                                        if (dia == '23') {
                                            dia23.push(sql)
                                        }
                                        if (dia == '24') {
                                            dia24.push(sql)
                                        }
                                        if (dia == '25') {
                                            dia25.push(sql)
                                        }
                                        if (dia == '26') {
                                            dia26.push(sql)
                                        }
                                        if (dia == '27') {
                                            dia27.push(sql)
                                        }
                                        if (dia == '28') {
                                            dia28.push(sql)
                                        }
                                        if (dia == '29') {
                                            dia29.push(sql)
                                        }
                                        if (dia == '30') {
                                            dia30.push(sql)
                                        }
                                        if (dia == '31') {
                                            dia31.push({ projeto: cliente.nome, ehManutencao: true, id: e._id, tarefa, feito })
                                        }
                                    }
                                    dia++
                                }
                                //console.log('lista_tarefas.length=>' + lista_tarefas.length)
                                if (q == lista_tarefas.length) {
                                    //console.log('messel=>' + messel)
                                    //console.log('ano=>' + ano)
                                    //console.log('mestitulo=>' + mestitulo)
                                    res.render('principal/agenda', {
                                        dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                                        dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                                        dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                                        dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                                        dia29, dia30, dia31,
                                        mes, anotitulo: ano, meshoje: messel, mestitulo, janeiro, fevereiro, marco, abril, maio, junho,
                                        julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true
                                    })
                                }
                            })
                        })
                    })
                } else {
                    if (q == lista_tarefas.length) {
                        //console.log('mestitulo=>' + mestitulo)
                        res.render('principal/agenda', {
                            dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                            dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                            dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                            dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                            dia29, dia30, dia31,
                            mes, anotitulo: ano, meshoje, mestitulo, janeiro, fevereiro, marco, abril, maio, junho,
                            julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true
                        })
                    }
                }
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar o tarefas cadastradas neste mês e ano.')
                res.redirect('/gerenciamento/agenda/')
            })
        })
    }
})

router.post('/salvarsrv', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    if (req.body.id == '') {
        new Servico({
            user: id,
            descricao: req.body.descricao,
            classe: req.body.classe,
            data: dataHoje()
        }).save().then(() => {
            req.flash('success_msg', 'Serviço criado com sucesso.')
            res.redirect('/gerenciamento/servicos')
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao salvar o tipo de serviço.')
        })
    } else {
        Servico.findOne({ _id: req.body.id }).then((servico) => {
            servico.descricao = req.body.descricao
            servico.classe = req.body.classe
            servico.save().then(() => {
                req.flash('success_msg', 'Serviço salvo com sucesso.')
                res.redirect('/gerenciamento/servicos')
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao salvar o tipo de serviço.')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar o tipo de serviço.')
        })

    }
});

router.get('/editarsrv/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    Servico.find({ user: id }).lean().then((servicos) => {
        Servico.findOne({ _id: req.params.id }).lean().then((servico) => {
            //     //console.log(servico)
            res.render('principal/servicos', { servicos, servico })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar o tipo de serviço.')
            res.redirect('/gerenciamento/servicos')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar todos os tipos de serviço.')
        res.redirect('/gerenciamento/servicos')
    })
});

router.get('/seltarefa/:id', ehAdmin, (req, res) => {
    Tarefas.findOne({ _id: req.params.id }).then((tarefa) => {
        if (tarefa.selecionado) {
            tarefa.selecionado = false
        } else {
            tarefa.selecionado = true
        }
        tarefa.save().then(() => {
            res.redirect('/gerenciamento/assistencia')
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao salvar a tarefa.')
            res.redirect('/gerenciamento/assistencia')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/gerenciamento/assistencia')
    })
});

router.post('/baixardia/', ehAdmin, (req, res) => {
    var mensagem = ''
    var dias = []
    var tamdias = 0
    var diaantes = 0
    var dia = 0
    var data2 = new Date(req.body.databaixa)
    Tarefas.findOne({ _id: req.body.id, $or: [{ dataini: req.body.databaixa }, { datafim: req.body.databaixa }, { 'buscadataini': { $lte: dataBusca(req.body.databaixa) } }, { 'buscadatafim': { $gte: dataBusca(req.body.databaixa) } }], $and: [{ 'buscadataini': { $lte: dataBusca(req.body.databaixa) } }, { 'buscadatafim': { $gte: dataBusca(req.body.databaixa) } }] }).then((t) => {
        if (naoVazio(t)) {

            var data1 = new Date(t.dataini)
            if (data2 > data1) {
                dif = Math.abs(data2.getTime() - data1.getTime())
                days = Math.ceil(dif / (1000 * 60 * 60 * 24))
                //console.log('days=>' + days)
                dia = days + 1
                //console.log('dia=>' + dia)
                Tarefas.findOneAndUpdate({ _id: req.body.id, 'dias.dia': dia }, { $set: { 'dias.$.feito': true } }).then(() => {
                    dias = t.dias
                    tamdias = dias.length
                    diaantes = dia - 2
                    diadepois = dia
                    mensagem = 'Dia baixado com sucesso.'
                    //console.log('tamdias=>' + tamdias)
                    //console.log('dia=>' + dia)
                    if ((tamdias == dia) && (dias[diaantes].feito == true)) {
                        t.concluido = true
                        t.databaixa = dataHoje()
                        t.save().then(() => {
                            mensagem = mensagem + ' Tarefa baixada com sucesso'
                            req.flash('success_msg', mensagem)
                            res.redirect('/gerenciamento/tarefa/' + req.body.id)
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve um erro ao baixar o dia da tarefa.')
                            res.redirect('/gerenciamento/tarefa/' + req.body.id)
                        })
                    } else {

                        req.flash('success_msg', mensagem)
                        res.redirect('/gerenciamento/tarefa/' + req.body.id)


                    }
                    // diaantes = dias[days].feito
                    // diadepois = dias[dia].feito
                    //console.log('diaantes=>' + diaantes)
                    //console.log('diadepois=>' + diadepois)
                }).catch((err) => {
                    req.flash('error_msg', 'Houve um erro ao baixar o dia da tarefa.')
                    res.redirect('/gerenciamento/tarefa/' + req.body.id)
                })
            } else {
                //console.log('mesmo dia')
                Tarefas.findOneAndUpdate({ _id: req.body.id, 'dias.dia': 1 }, { $set: { 'dias.$.feito': true } }).then(() => {
                    //console.log('achou mesmo dia')
                    req.flash('success_msg', 'Dia baixado com sucesso.')
                    res.redirect('/gerenciamento/tarefa/' + req.body.id)
                }).catch((err) => {
                    req.flash('error_msg', 'Houve um erro ao baixar o dia da tarefa.')
                    res.redirect('/gerenciamento/tarefa/' + req.body.id)
                })
            }
        } else {
            req.flash('aviso_msg', 'Não é possível baixar uma data fora do cronograma da tarefa.')
            res.redirect('/gerenciamento/tarefa/' + req.body.id)
        }
    })
});

router.get('/mostraEquipe/:id', ehAdmin, (req, res) => {
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        if (naoVazio(projeto)) {
            Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente) => {
                Equipe.findOne({ _id: projeto.equipe }).lean().then((equipe) => {
                    Pessoa.findOne({ _id: projeto.responsavel }).lean().then((responsavel) => {
                        Pessoa.findOne({ _id: equipe.insres }).lean().then((insres) => {
                            res.render('principal/mostraEquipe', { servico: params[1], projeto, equipe, cliente, responsavel, insres })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar o instalador responsável.')
                            res.redirect('/dashboard')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar o responsável.')
                        res.redirect('/dashboard')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a equipe.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar o cliente.')
                res.redirect('/dashboard')
            })
        } else {
            var realizar
            //console.log('mostrar tarefa')
            Tarefas.findOne({ _id: req.params.id }).lean().then((tarefa) => {
                //console.log(tarefa)
                if (naoVazio(tarefa)) {
                    Servico.findOne({ _id: tarefa.servico }).lean().then((servico) => {
                        Cliente.findOne({ _id: tarefa.cliente }).lean().then((cliente) => {
                            Equipe.findOne({ _id: tarefa.equipe }).lean().then((equipe) => {
                                Pessoa.findOne({ _id: tarefa.responsavel }).lean().then((tecnico) => {
                                    realizar = equipe.feito
                                    Pessoa.findOne({ _id: tarefa.gestor }).lean().then((gestor) => {
                                        res.render('principal/mostraEquipe', { servico, realizar, tarefa, equipe, cliente, tecnico, gestor })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar o gestor responsável.')
                                        res.redirect('/dashboard')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar o tecnico responsável.')
                                    res.redirect('/dashboard')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar a equipe.')
                                res.redirect('/dashboard')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar o cliente.')
                            res.redirect('/dashboard')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar o serviço.')
                        res.redirect('/dashboard')
                    })
                } else {
                    req.flash('error_msg', 'Equipe não formada.')
                    res.redirect('/dashboard')
                }
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar a tarefa.')
                res.redirect('/dashboard')
            })
        }
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar a projeto<me>.')
        res.redirect('/dashboard')
    })
});

router.get('/realizar/:id', ehAdmin, (req, res) => {
    Tarefas.findOne({ _id: req.params.id }).then((tarefa) => {
        Equipe.findOne({ _id: tarefa.equipe }).then((equipe) => {
            equipe.feito = true
            equipe.save().then(() => {
                tarefa.concluido = true
                tarefa.dataentrega = dataBusca(dataHoje())
                tarefa.save().then(() => {
                    res.redirect('/gerenciamento/mostraEquipe/' + tarefa._id)
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao salvar a tarefa.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao salvar a equipe.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar a equipe.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar a tarefa.')
        res.redirect('/dashboard')
    })
});

router.get('/servicos/', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    Servico.find({ user: id }).lean().then((servicos) => {
        res.render('principal/servicos', { servicos })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar os serviços.')
        res.redirect('/dashboard')
    })
});

router.post('/selecionacliente', ehAdmin, (req, res) => {
    const { _id } = req.user
    Cliente.find({ user: id }).lean().then((cliente) => {
        var ehSelecao = true
        res.render('projeto/gerenciamento/tarefa', { cliente, ehSelecao })
    }).catch(() => {
        res.flash('error_msg', 'Não há cliente cadastrado.')
        req.redirect('/agenda')
    })
});

router.get('/seleciona/:id', ehAdmin, (req, res) => {
    Projeto.findOne({ _id: req.params.id }).then((projeto) => {
        Equipe.findOne({ _id: projeto.equipe }).then((equipe) => {
            if (equipe.ativo == true) {
                equipe.ativo = false
                equipe.save().then(() => {
                    res.redirect('/dashboard')
                })
            } else {
                equipe.ativo = true
                equipe.save().then(() => {
                    res.redirect('/dashboard')
                })
            }
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/dashboard')
    })
})

module.exports = router;