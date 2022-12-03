const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

require('../model/Projeto')
require('../model/Pessoa')
require('../model/Cliente')
require('../model/Equipe')
require('../model/Empresa')
require('../model/Pedido')
require('../model/Mensagem')

const Projeto = mongoose.model('projeto')
const Pessoa = mongoose.model('pessoa')
const Cliente = mongoose.model('cliente')
const Equipe = mongoose.model('equipe')
const Empresa = mongoose.model('empresa')
const Pedido = mongoose.model('pedido')
const Mensagem = mongoose.model('mensagem')

const pegames = require('../resources/pegames')
const dataBusca = require('../resources/dataBusca')
const dataMensagem = require('../resources/dataMensagem')
const dataHoje = require('../resources/dataHoje')
const filtrarProjeto = require('../resources/filtrar')
const naoVazio = require('../resources/naoVazio')
const { ehAdmin } = require('../helpers/ehAdmin')
const dataMsgNum = require('../resources/dataMsgNum')
const dataInput = require('../resources/dataInput')
const mascaraDecimal = require('../resources/mascaraDecimal')
const comparaNum = require('../resources/comparaNumeros')

router.get('/consulta', ehAdmin, (req, res) => {
    var id
    var sql_prj = []
    var sql_pes = []
    const { _id } = req.user
    const { user } = req.user
    const { pessoa } = req.user
    const { orcamentista } = req.user
    const { instalador } = req.user
    const { vendedor } = req.user
    const { funges } = req.user

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    //console.log('funges=>' + funges)
    //console.log('orcamentista=>' + orcamentista)

    if (funges || orcamentista || naoVazio(user) == false) {
        sql_prj = { user: id }
        sql_pes = { user: id, vendedor: 'checked' }
    }

    var lista = []
    var q = 0
    var dtcadastro = '00000000'
    var dtinicio = '0000-00-00'
    var dtfim = '0000-00-00'
    var nome_vendedor
    var valor = 0
    var total = 0

    //console.log('sql_pes=>' + JSON.stringify(sql_pes))
    //console.log('sql_prj=>' + JSON.stringify(sql_prj))

    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
            Projeto.find({ user: id }).sort({ 'data': -1 }).then((projeto) => {
                if (naoVazio(projeto)) {
                    projeto.forEach((e) => {
                        Cliente.findOne({ _id: e.cliente }).then((cliente) => {
                            Pessoa.findOne({ _id: e.vendedor }).then((vendedor) => {
                                q++
                                //console.log('e.datacad=>' + e.datacad)
                                if (naoVazio(e.datacad)) {
                                    dtcadastro = e.datacad
                                } else {
                                    dtcadastro = '00000000'
                                }

                                if (naoVazio(e.dtinicio)) {
                                    dtinicio = e.dtinicio
                                } else {
                                    dtinicio = '0000-00-00'
                                }

                                if (naoVazio(e.dtfim)) {
                                    dtfim = e.dtfim
                                } else {
                                    dtfim = '0000-00-00'
                                }

                                if (naoVazio(vendedor)) {
                                    nome_vendedor = vendedor.nome
                                } else {
                                    nome_vendedor = ''
                                }
                                if (naoVazio(e.valor)) {
                                    total = total + e.valor
                                    valor = e.valor
                                } else {
                                    valor = 0
                                }


                                lista.push({ s: e.status, id: e._id, seq: e.seq, uf: e.uf, cidade: e.cidade, valor: mascaraDecimal(valor), cliente: cliente.nome, nome_vendedor, cadastro: dataMsgNum(dtcadastro), inicio: dataMensagem(dtinicio), fim: dataMensagem(dtfim) })

                                if (q == projeto.length) {
                                    lista.sort(comparaNum)
                                    res.render('relatorios/consulta', { qtd: q, lista, todos_clientes, todos_vendedores, total: mascaraDecimal(total), mostrar: 'none' })
                                }

                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhum vendedor encontrado.')
                                res.redirect('/dashboard')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Nenhum cliente encontrado.')
                            res.redirect('/dashboard')
                        })
                    })
                } else {
                    res.render('relatorios/consulta', { lista, todos_clientes, todos_vendedores, mostrar: 'none' })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Nenhuma projeto encontrada.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum responsável encontrado.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrada.')
        res.redirect('/dashboard')
    })
})

router.get('/consulta/:tipo', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var listaOrcado = []
    var listaAberto = []
    var listaEncerrado = []
    var listaBaixado = []
    var dtcadastro = '00000000'
    var responsavel = ''
    var nome_insres = ''
    var q = 0

    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, funges: 'checked' }).lean().then((todos_responsaveis) => {
            Empresa.find({ user: id }).lean().then((todas_empresas) => {
                Projeto.find({ user: id }).sort({ 'data': -1 }).then((projeto) => {
                    if (projeto != '') {
                        projeto.forEach((e) => {
                            Cliente.findOne({ _id: e.cliente }).then((lista_cliente) => {
                                Equipe.findOne({ _id: e.equipe }).then((equipe) => {
                                    Pessoa.findOne({ _id: e.responsavel }).then((lista_responsavel) => {
                                        Pessoa.findOne({ _id: equipe.insres }).then((insres) => {
                                            q++
                                            if (naoVazio(e.datacad)) {
                                                dtcadastro = e.datacad
                                            } else {
                                                dtcadastro = '00000000'
                                            }

                                            if (naoVazio(lista_responsavel)) {
                                                responsavel = lista_responsavel.nome
                                            } else {
                                                responsavel = ''
                                            }
                                            //console.log('resposanvel1=>' + responsavel)

                                            if (naoVazio(insres)) {
                                                nome_insres = insres.nome
                                            } else {
                                                nome_insres = ''
                                            }
                                            //console.log('nome_insres=>' + nome_insres)
                                            //console.log('resposanvel2=>' + responsavel)
                                            if (e.baixada == true) {
                                                listaBaixado.push({ id: e._id, seq: e.seq, motivo: e.motivo, dtbaixa: dataMensagem(e.dtbaixa), cliente: lista_cliente.nome, responsavel, cadastro: dataMsgNum(dtcadastro) })
                                            } else {
                                                if (e.feito == true && e.ganho == false && e.encerrado == false) {
                                                    listaOrcado.push({ id: e._id, seq: e.seq, cliente: lista_cliente.nome, responsavel, nome_insres, cadastro: dataMsgNum(dtcadastro), inicio: dataMensagem(equipe.dtinicio), fim: dataMensagem(equipe.dtfim) })
                                                } else {
                                                    if (e.feito == true && e.ganho == true && e.encerrado == false) {
                                                        listaAberto.push({ id: e._id, seq: e.seq, cliente: lista_cliente.nome, responsavel, nome_insres, cadastro: dataMsgNum(dtcadastro), inicio: dataMensagem(equipe.dtinicio), fim: dataMensagem(equipe.dtfim) })
                                                    } else {
                                                        listaEncerrado.push({ id: e._id, seq: e.seq, cliente: lista_cliente.nome, responsavel, nome_insres, cadastro: dataMsgNum(dtcadastro), inicio: dataMensagem(equipe.dtinicio), fim: dataMensagem(equipe.dtfim) })
                                                    }
                                                }
                                            }

                                            //console.log('q=>' + q)
                                            //console.log('req.params.tipo=>' + req.params.tipo)
                                            if (q == projeto.length) {
                                                if (req.params.tipo == 'baixado') {
                                                    res.render('relatorios/consulta', { listaBaixado, todos_clientes, todos_responsaveis, todas_empresas, tipo: 'baixado', titulo: ': Projeto Baixas' })
                                                } else {
                                                    if (req.params.tipo == 'orcado') {
                                                        res.render('relatorios/consulta', { listaOrcado, todos_clientes, todos_responsaveis, todas_empresas, tipo: 'orcado', titulo: ': Propostas Enviadas' })
                                                    } else {
                                                        if (req.params.tipo == 'aberto') {
                                                            res.render('relatorios/consulta', { listaAberto, todos_clientes, todos_responsaveis, todas_empresas, tipo: 'aberto', titulo: ': Em Aberto' })
                                                        } else {
                                                            res.render('relatorios/consulta', { listaEncerrado, todos_clientes, todos_responsaveis, todas_empresas, tipo: 'encerrado', titulo: ': Encerrado' })
                                                        }
                                                    }
                                                }
                                            }

                                        }).catch((err) => {
                                            req.flash('error_msg', 'Nenhum técnico responsável encontrado.')
                                            res.redirect('/dashboard')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Nenhum gestor responsável encontrado.')
                                        res.redirect('/dashboard')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Nenhumaa equipe encontrada.')
                                    res.redirect('/dashboard')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhuma cliente encontrado.')
                                res.redirect('/dashboard')
                            })
                        })
                    } else {
                        if (req.params.tipo == 'orcado') {
                            res.render('relatorios/consulta', { todos_clientes, todos_responsaveis, todas_empresas, tipo: 'orcado', titulo: ': Orçamentos Enviados' })
                        } else {
                            if (req.params.tipo == 'aberto') {
                                res.render('relatorios/consulta', { todos_clientes, todos_responsaveis, todas_empresas, tipo: 'aberto', titulo: ': Em Aberto' })
                            } else {
                                res.render('relatorios/consulta', { todos_clientes, todos_responsaveis, todas_empresas, tipo: 'encerrado', titulo: ': Encerrado' })
                            }
                        }
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Nenhuma projeto encontrado<todas>')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Nenhuma empresa encontrada.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum responsável encontrado.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrado.')
        res.redirect('/dashboard')
    })
})

router.get('/analiseproposta', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    // var lista_envio = []
    var lista_ganho = []
    var lista_naoganho = []
    var lista_preco = []
    var lista_prazo = []
    var lista_finan = []
    var lista_conco = []
    var lista_smoti = []
    var lista_negoc = []
    var lista_anali = []
    var lista_compa = []
    var lista_reduc = []
    var lista_envia = []
    var venGanhoTotal = []
    var venNaoGanhoTotal = []
    var soma = 0
    // var qtd_ganho = []
    // var qtd_naoganho = []
    // var qtd_envio = []
    // var qtd_preco = []
    // var qtd_prazo = []
    // var qtd_finan = []
    // var qtd_conco = []
    // var qtd_smoti = []    
    var q = 0
    var x = 0

    var totalGanho = 0
    var totalNaoGanho = 0
    var totalEnviado = 0
    var totalNegociando = 0
    var totalPerdido = 0
    var totalAberto = 0
    var totalPreco = 0
    var totalPrazo = 0
    var totalFinan = 0
    var totalNegoc = 0
    var totalConco = 0
    var totalSmoti = 0
    var totalAnali = 0
    var totalCompa = 0
    var totalReduc = 0
    var total

    var baixado
    var dataini
    var datafim
    var dtinicio
    var dtfim
    var mestitulo
    var hoje = dataHoje()
    var meshoje = hoje.substring(5, 7)
    var anotitulo = hoje.substring(0, 4)

    console.log('meshoje=>' + meshoje)

    switch (meshoje) {
        case '01':
            dataini = anotitulo + '01' + '01'
            datafim = anotitulo + '01' + '31'
            mestitulo = 'Janeiro '
            break;
        case '02':
            dataini = anotitulo + '02' + '01'
            datafim = anotitulo + '02' + '28'
            mestitulo = 'Fevereiro '
            break;
        case '03':
            dataini = anotitulo + '03' + '01'
            datafim = anotitulo + '03' + '31'
            mestitulo = 'Março '
            break;
        case '04':
            dataini = anotitulo + '04' + '01'
            datafim = anotitulo + '04' + '30'
            mestitulo = 'Abril '
            break;
        case '05':
            dataini = anotitulo + '05' + '01'
            datafim = anotitulo + '05' + '31'
            mestitulo = 'Maio '
            break;
        case '06':
            dataini = anotitulo + '06' + '01'
            datafim = anotitulo + '06' + '30'
            mestitulo = 'Junho '
            break;
        case '07':
            dataini = anotitulo + '07' + '01'
            datafim = anotitulo + '07' + '31'
            mestitulo = 'Julho '
            break;
        case '08':
            dataini = anotitulo + '08' + '01'
            datafim = anotitulo + '08' + '30'
            mestitulo = 'Agosto '
            break;
        case '09':
            dataini = anotitulo + '09' + '01'
            datafim = anotitulo + '09' + '31'
            mestitulo = 'Setembro '
            break;
        case '10':
            dataini = anotitulo + '10' + '01'
            datafim = anotitulo + '10' + '31'
            mestitulo = 'Outubro '
            break;
        case '11':
            dataini = anotitulo + '11' + '01'
            datafim = anotitulo + '11' + '30'
            mestitulo = 'Novembro '
            break;
        case '12':
            dataini = anotitulo + '12' + '01'
            datafim = anotitulo + '12' + '31'
            mestitulo = 'Dezembro '
            break;
        default:
            dataini = anotitulo + '01' + '01'
            datafim = anotitulo + '12' + '31'
            mestitulo = 'Todo ano '
    }
    console.log('dataini=>' + dataini)
    console.log('datafim=>' + datafim)
    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Projeto.find({ user: id, datacad: { $lte: datafim, $gte: dataini } }).then((projeto) => {
            //console.log('projeto=>' + projeto)
            if (naoVazio(projeto)) {
                Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((pessoa) => {
                    pessoa.forEach((e) => {
                        console.log('e.nome=>' + e.nome)
                        Projeto.find({ user: id, vendedor: e._id, datacad: { $lte: datafim, $gte: dataini } }).then((pr) => {
                            console.log('pr.length=>' + pr.length)
                            if (pr.length > 0) {
                                pr.forEach((p) => {
                                    q++
                                    if (p.baixada == true) {
                                        baixado = 'Sim'
                                    } else {
                                        baixado = 'Não'
                                    }

                                    if (naoVazio(p.dtinicio)) {
                                        dtinicio = p.dtinicio
                                    } else {
                                        dtinicio = '0000-00-00'
                                    }

                                    if (naoVazio(p.dtfim)) {
                                        dtfim = p.dtfim
                                    } else {
                                        dtfim = '0000-00-00'
                                    }
                                    if (naoVazio(p.motivo) && p.baixada == true) {
                                        if (naoVazio(p.valor)) {
                                            totalPerdido = totalPerdido + p.valor
                                        }
                                        if (p.motivo == 'Fechou com concorrente') {
                                            lista_conco.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                            if (naoVazio(p.valor)) {
                                                totalConco = totalConco + p.valor
                                            }
                                        }
                                        if (p.motivo == 'Não conseguiu o financiamento') {
                                            lista_finan.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                            if (naoVazio(p.valor)) {
                                                totalFinan = totalFinan + p.valor
                                            }
                                        }
                                        if (p.motivo == 'Preço elevado') {
                                            lista_preco.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                            if (naoVazio(p.valor)) {
                                                totalPreco = totalPreco + p.valor
                                            }
                                        }
                                        if (p.motivo == 'Prazo de instalação') {
                                            lista_prazo.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                            if (naoVazio(p.valor)) {
                                                totalPrazo = totalPrazo + p.valor
                                            }
                                        }
                                        if (p.motivo == 'Sem motivo') {
                                            lista_smoti.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                            if (naoVazio(p.valor)) {
                                                totalSmoti = totalSmoti + p.valor
                                            }
                                        }
                                    } else {
                                        if (naoVazio(p.status) && p.ganho == false) {
                                            // if (naoVazio(p.valor)) {
                                            //     totalAberto = totalAberto + p.valor 
                                            // }
                                            if (p.status == 'Enviado') {
                                                lista_envia.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                if (naoVazio(p.valor)) {
                                                    totalEnviado = totalEnviado + p.valor
                                                }
                                            }
                                            if (p.status == 'Negociando') {
                                                lista_negoc.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                if (naoVazio(p.valor)) {
                                                    totalNegoc = totalNegoc + p.valor
                                                    totalNegociando = totalNegociando + p.valor
                                                }
                                            }
                                            if (p.status == 'Analisando Financiamento') {
                                                lista_anali.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                if (naoVazio(p.valor)) {
                                                    totalAnali = totalAnali + p.valor
                                                    totalNegociando = totalNegociando + p.valor
                                                }
                                            }
                                            if (p.status == 'Comparando Propostas') {
                                                lista_compa.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                if (naoVazio(p.valor)) {
                                                    totalCompa = totalCompa + p.valor
                                                    totalNegociando = totalNegociando + p.valor
                                                }
                                            }
                                            if (p.status == 'Aguardando redução de preço') {
                                                lista_reduc.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                if (naoVazio(p.valor)) {
                                                    totalReduc = totalReduc + p.valor
                                                    totalNegociando = totalNegociando + p.valor
                                                }
                                            }
                                            totalAberto = totalNegociando + totalEnviado
                                        }
                                    }

                                    // if (p.feito == true) {
                                    //     lista_envio.push({ responsavel: e.nome, projeto: p.seq, datacad: p.datacad, dataini: dataMensagem(equipe.dtinicio), datafim: dataMensagem(equipe.dtfim) })
                                    // }
                                    if (p.ganho == true) {
                                        lista_ganho.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim), valor: p.valor })
                                        if (naoVazio(p.valor)) {
                                            totalGanho = totalGanho + p.valor
                                        }
                                    } else {
                                        lista_naoganho.push({ baixado, responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim), valor: p.valor })
                                        if (naoVazio(p.valor)) {
                                            totalNaoGanho = totalNaoGanho + p.valor
                                        }
                                    }
                                    // console.log('q=>' + q)
                                    // console.log('pr.length=>' + pr.length)
                                    if (q == pr.length) {
                                        q = 0
                                        x++
                                        // Pessoa.find({ user: id, vendedor: 'checked' }).then((pessoa_total) => {
                                        lista_ganho.forEach((g) => {
                                            // console.log('e.valor=>' + g.valor)
                                            // console.log('e.nome=>' + e.nome)
                                            if (e.nome == g.responsavel) {
                                                soma = soma + parseFloat(g.valor)
                                                // console.log("soma=>" + soma)
                                            }
                                        })
                                        // console.log("soma=>" + soma)
                                        venGanhoTotal.push({ nome: e.nome, total: mascaraDecimal(soma) })
                                        soma = 0
                                        lista_naoganho.forEach((ng) => {
                                            // console.log('e.valor=>' + ng.valor)
                                            // console.log('e.nome=>' + e.nome)
                                            if (e.nome == ng.responsavel) {
                                                soma = soma + parseFloat(ng.valor)
                                                // console.log("soma=>" + soma)
                                            }
                                        })
                                        // console.log("soma=>" + soma)
                                        venNaoGanhoTotal.push({ nome: e.nome, total: mascaraDecimal(soma) })
                                        soma = 0

                                        total = totalGanho + totalNaoGanho
                                        // console.log('x=>' + x)
                                        // console.log('pessoa.length=>' + pessoa.length)
                                        if (x == pessoa.length) {
                                            res.render('relatorios/analiseproposta', {
                                                todos_clientes, pessoa, lista_ganho, lista_naoganho,
                                                qtd_conco: lista_conco.length, qtd_finan: lista_finan.length, qtd_preco: lista_preco.length, qtd_prazo: lista_prazo.length,
                                                qtd_smoti: lista_smoti.length, qtd_negoc: lista_negoc.length, qtd_anali: lista_anali.length, qtd_compa: lista_compa.length, qtd_reduc: lista_reduc.length, qtd_envia: lista_envia.length,
                                                naoganho_total: lista_naoganho.length, ganho_total: lista_ganho.length, mestitulo, anotitulo, dataini: dataInput(dataini), datafim: dataInput(datafim),
                                                totalEnviado: mascaraDecimal(totalEnviado),
                                                totalNegociando: mascaraDecimal(totalNegociando),
                                                totalPerdido: mascaraDecimal(totalPerdido),
                                                totalPreco: mascaraDecimal(totalPreco),
                                                totalPrazo: mascaraDecimal(totalPrazo),
                                                totalFinan: mascaraDecimal(totalFinan),
                                                totalNegoc: mascaraDecimal(totalNegoc),
                                                totalConco: mascaraDecimal(totalConco),
                                                totalSmoti: mascaraDecimal(totalSmoti),
                                                totalAnali: mascaraDecimal(totalAnali),
                                                totalCompa: mascaraDecimal(totalCompa),
                                                totalReduc: mascaraDecimal(totalReduc),
                                                totalGanho: mascaraDecimal(totalGanho),
                                                totalNaoGanho: mascaraDecimal(totalNaoGanho),
                                                totalAberto: mascaraDecimal(totalAberto),
                                                total: mascaraDecimal(total),
                                                venGanhoTotal, venNaoGanhoTotal
                                            })
                                        }
                                        //})
                                    }
                                })
                            } else {
                                q++
                                console.log('q=>' + q)
                                console.log('pr.length=>' + pr.length)
                                if (q == pr.length || pr.length == 0) {
                                    q = 0
                                    x++
                                    // Pessoa.find({ user: id, vendedor: 'checked' }).then((pessoa_total) => {
                                    lista_ganho.forEach((g) => {
                                        // console.log('e.valor=>' + g.valor)
                                        // console.log('e.nome=>' + e.nome)
                                        if (e.nome == g.responsavel) {
                                            soma = soma + parseFloat(g.valor)
                                            // console.log("soma=>" + soma)
                                        }
                                    })
                                    // console.log("soma=>" + soma)
                                    venGanhoTotal.push({ nome: e.nome, total: mascaraDecimal(soma) })
                                    soma = 0
                                    lista_naoganho.forEach((ng) => {
                                        // console.log('e.valor=>' + ng.valor)
                                        // console.log('e.nome=>' + e.nome)
                                        if (e.nome == ng.responsavel) {
                                            soma = soma + parseFloat(ng.valor)
                                            // console.log("soma=>" + soma)
                                        }
                                    })
                                    // console.log("soma=>" + soma)
                                    venNaoGanhoTotal.push({ nome: e.nome, total: mascaraDecimal(soma) })
                                    soma = 0

                                    total = totalGanho + totalNaoGanho
                                    // console.log('x=>' + x)
                                    // console.log('pessoa.length=>' + pessoa.length)
                                    if (x == pessoa.length) {
                                        res.render('relatorios/analiseproposta', {
                                            todos_clientes, pessoa, lista_ganho, lista_naoganho,
                                            qtd_conco: lista_conco.length, qtd_finan: lista_finan.length, qtd_preco: lista_preco.length, qtd_prazo: lista_prazo.length,
                                            qtd_smoti: lista_smoti.length, qtd_negoc: lista_negoc.length, qtd_anali: lista_anali.length, qtd_compa: lista_compa.length, qtd_reduc: lista_reduc.length, qtd_envia: lista_envia.length,
                                            naoganho_total: lista_naoganho.length, ganho_total: lista_ganho.length, mestitulo, anotitulo, dataini: dataInput(dataini), datafim: dataInput(datafim),
                                            totalEnviado: mascaraDecimal(totalEnviado),
                                            totalNegociando: mascaraDecimal(totalNegociando),
                                            totalPerdido: mascaraDecimal(totalPerdido),
                                            totalPreco: mascaraDecimal(totalPreco),
                                            totalPrazo: mascaraDecimal(totalPrazo),
                                            totalFinan: mascaraDecimal(totalFinan),
                                            totalNegoc: mascaraDecimal(totalNegoc),
                                            totalConco: mascaraDecimal(totalConco),
                                            totalSmoti: mascaraDecimal(totalSmoti),
                                            totalAnali: mascaraDecimal(totalAnali),
                                            totalCompa: mascaraDecimal(totalCompa),
                                            totalReduc: mascaraDecimal(totalReduc),
                                            totalGanho: mascaraDecimal(totalGanho),
                                            totalNaoGanho: mascaraDecimal(totalNaoGanho),
                                            totalAberto: mascaraDecimal(totalAberto),
                                            total: mascaraDecimal(total),
                                            venGanhoTotal, venNaoGanhoTotal
                                        })
                                    }
                                    //})
                                }
                            }
                        })
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Nenhum responsável encontrado.')
                    res.redirect('/dashboard')
                })
            } else {
                res.render('relatorios/analiseproposta', {
                    todos_clientes, mestitulo, anotitulo, dataini: dataInput(dataini), datafim: dataInput(datafim),
                })
            }
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum projeto encontrado para este filtro.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum cliente encontrado.')
        res.redirect('/dashboard')
    })

})

router.get('/analisegeral/', ehAdmin, (req, res) => {
    const { _id } = req.user
    var potencia = 0
    var valor = 0
    var totint = 0
    var qtdmod = 0
    var custoPlano = 0
    var q = 0
    Realizado.find({ user: _id }).sort({ datafim: 'asc' }).lean().then((realizado) => {
        realizado.forEach((element) => {
            Projetos.findOne({ _id: element.projeto }).then((projeto) => {

                // if (projeto.ehDireto) {
                if (projeto.qtdmod > 0) {
                    qtdmod = qtdmod + projeto.qtdmod
                } else {
                    qtdmod = qtdmod + 0
                }
                // }
                // } else {
                //     if (projeto.unimod != '' || typeof projeto.unimod != 'undefined'){
                //         qtdmod = qtdmod + projeto.unimod
                //     }
                // }
                //console.log('realizado._id=>' + element._id)
                //console.log("potencia=>" + element.potencia)
                //console.log("qtdmod=>" + qtdmod)
                if (element.potencia != '' && typeof element.potencia != 'undefined') {
                    potencia = parseFloat(potencia) + parseFloat(element.potencia)
                }
                valor = valor + element.valor
                totint = totint + element.totint
                custoPlano = custoPlano + element.custoPlano

                q = q + 1
                if (q == realizado.length) {
                    var rspmod = (parseFloat(valor) / parseFloat(qtdmod)).toFixed(2)
                    var rspkwp = (parseFloat(valor) / parseFloat(potencia)).toFixed(2)
                    var rsimod = (parseFloat(totint) / parseFloat(qtdmod)).toFixed(2)
                    var rsikwp = (parseFloat(totint) / parseFloat(potencia)).toFixed(2)
                    var custoPorModulo = (parseFloat(custoPlano) / parseFloat(qtdmod)).toFixed(2)
                    var custoPorKwp = (parseFloat(custoPlano) / parseFloat(potencia)).toFixed(2)
                    res.render('relatorios/analisegeral', { potencia, qtdmod, valor, rspkwp, rspmod, rsimod, rsikwp, custoPorModulo, custoPorKwp })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro para encontrar projetos realizados')
                res.redirect('/menu')
            })
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro para encontrar projetos realizados')
        res.redirect('/menu')
    })
})

router.get('/pedido/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { instalador } = req.user
    const { orcamentista } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    var imprime
    var id
    var ehCPF = false

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    // if (naoVazio(params[1])){
    //     imprime = 'none'
    // }else{
    //     imprime = ''
    // }

    Empresa.findOne({ user: id }).lean().then((empresa) => {
        Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
            Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente) => {
                Pessoa.findOne({ _id: projeto.vendedor }).lean().then((ven) => {
                    Mensagem.find({ user: id }).lean().then((mensagem) => {
                        Pedido.findOne({ _id: projeto.pedido }).lean().then((pedido) => {
                            //console.log('empresa=>' + empresa)
                            //console.log('logo=>' + empresa.logo)
                            if (cliente.cpf != 0) {
                                ehCPF = true
                            }
                            res.render('relatorios/pedido', {
                                cliente,
                                projeto,
                                mensagem,
                                vendedor,
                                instalador,
                                orcamentista,
                                funges,
                                funpro,
                                ehCPF,
                                pedido,
                                vlrServico: mascaraDecimal(pedido.vlrServico),
                                vlrKit: mascaraDecimal(pedido.vlrKit),
                                vlrTotal: mascaraDecimal(pedido.vlrTotal),
                                vendedor: ven.nome,
                                logo: empresa.logo,
                                nome: empresa.nome,
                                cnpj: empresa.cnpj,
                                endereco: empresa.endereco,
                                cidade: empresa.cidade,
                                uf: empresa.uf,
                                celular: empresa.celular,
                                telefone: empresa.telefone,
                                website: empresa.website
                            })
                        })
                    })
                })
            })
        })
    })
})

router.get('/dashboardbi', ehAdmin, (req, res) => {
    const { _id } = req.user
    var checkKwp
    var checkQtd
    var checkFat
    var fatrural = 0
    var fatresid = 0
    var fatcomer = 0
    var fatindus = 0
    var fatmono = 0
    var fatbifa = 0
    var fattrif = 0
    var fatnivel1 = 0
    var fatnivel2 = 0
    var fatnivel3 = 0
    var fatnivel4 = 0
    var fatnivel5 = 0
    var fatnivel6 = 0
    var fatsolo = 0
    var fattelhado = 0

    checkFat = 'checked'
    checkKwp = 'unchecked'
    checkQtd = 'unchecked'
    Projetos.find({ user: _id, $or: [{ 'classUsina': 'Rural' }, { 'classUsina': 'Rural Residencial' }, { 'classUsina': 'Rural Granja' }, { 'classUsina': 'Rural Irrigação' }] }).then((rural) => {
        for (i = 0; i < rural.length; i++) {
            fatrural = fatrural + parseFloat(rural[i].vlrNFS)
        }
        Projetos.find({ user: _id, classUsina: 'Residencial' }).then((residencial) => {
            for (i = 0; i < residencial.length; i++) {
                fatresid = fatresid + parseFloat(residencial[i].vlrNFS)
            }
            Projetos.find({ user: _id, classUsina: 'Comercial' }).then((comercial) => {
                for (i = 0; i < comercial.length; i++) {
                    fatcomer = fatcomer + parseFloat(comercial[i].vlrNFS)
                }
                Projetos.find({ user: _id, classUsina: 'Industrial' }).then((industrial) => {
                    for (i = 0; i < industrial.length; i++) {
                        fatindus = fatindus + parseFloat(industrial[i].vlrNFS)
                    }
                    Projetos.find({ user: _id, $or: [{ 'tipoUsina': 'Solo Concreto' }, { 'tipoUsina': 'Solo Metal' }, { 'tipoUsina': 'Laje' }] }).then((solo) => {
                        for (i = 0; i < solo.length; i++) {
                            fatsolo = fatsolo + parseFloat(solo[i].vlrNFS)
                        }
                        Projetos.find({ user: _id, $or: [{ 'tipoUsina': 'Telhado Fibrocimento' }, { 'tipoUsina': 'Telhado Madeira' }, { 'tipoUsina': 'Telhado Cerâmica' }, { 'tipoUsina': 'Telhado Gambrel' }, { 'tipoUsina': 'Telhado Metálico' }] }).then((telhado) => {
                            for (i = 0; i < telhado.length; i++) {
                                fattelhado = fattelhado + parseFloat(telhado[i].vlrNFS)
                            }
                            Projetos.find({ user: _id, $or: [{ 'tipoConexao': 'Monofásico 127V' }, { 'tipoConexao': 'Monofásico 220V' }] }).then((monofasico) => {
                                for (i = 0; i < monofasico.length; i++) {
                                    fatmono = fatmono + parseFloat(monofasico[i].vlrNFS)
                                }
                                Projetos.find({ user: _id, tipoConexao: 'Bifásico 220V' }).then((bifasico) => {
                                    for (i = 0; i < bifasico.length; i++) {
                                        fatbifa = fatbifa + parseFloat(bifasico[i].vlrNFS)
                                    }
                                    Projetos.find({ user: _id, $or: [{ 'tipoConexao': 'Trifásico 220V' }, { 'tipoConexao': 'Trifásico 380V' }] }).then((trifasico) => {
                                        for (i = 0; i < trifasico.length; i++) {
                                            fattrif = fattrif + parseFloat(trifasico[i].vlrNFS)
                                        }
                                        Projetos.find({ user: _id, 'potencia': { $lte: 10 } }).then((nivel1) => {
                                            for (i = 0; i < nivel1.length; i++) {
                                                fatnivel1 = fatnivel1 + parseFloat(nivel1[i].vlrNFS)
                                            }
                                            Projetos.find({ user: _id, 'potencia': { $lte: 30, $gte: 11 } }).then((nivel2) => {
                                                for (i = 0; i < nivel2.length; i++) {
                                                    fatnivel2 = fatnivel2 + parseFloat(nivel2[i].vlrNFS)
                                                }
                                                Projetos.find({ user: _id, 'potencia': { $lte: 50, $gte: 31 } }).then((nivel3) => {
                                                    for (i = 0; i < nivel3.length; i++) {
                                                        fatnivel3 = fatnivel3 + parseFloat(nivel3[i].vlrNFS)
                                                    }
                                                    Projetos.find({ user: _id, 'potencia': { $lte: 100, $gte: 51 } }).then((nivel4) => {
                                                        for (i = 0; i < nivel4.length; i++) {
                                                            fatnivel4 = fatnivel4 + parseFloat(nivel4[i].vlrNFS)
                                                        }
                                                        Projetos.find({ user: _id, 'potencia': { $lte: 150, $gte: 101 } }).then((nivel5) => {
                                                            for (i = 0; i < nivel5.length; i++) {
                                                                fatnivel5 = fatnivel5 + parseFloat(nivel5[i].vlrNFS)
                                                            }
                                                            Projetos.find({ user: _id, 'potencia': { $lte: 200, $gte: 151 } }).then((nivel6) => {
                                                                for (i = 0; i < nivel6.length; i++) {
                                                                    fatnivel6 = fatnivel6 + parseFloat(nivel6[i].vlrNFS)
                                                                }
                                                                Realizado.find({ user: _id }).lean().then((realizados) => {
                                                                    Projetos.find({ user: _id, homologado: true }).lean().then((homologado) => {
                                                                        Projetos.find({ user: _id, atrasado: true }).lean().then((atrasado) => {
                                                                            Projetos.find({ user: _id, executando: true }).lean().then((executando) => {
                                                                                Projetos.find({ user: _id, orcado: true }).lean().then((orcado) => {
                                                                                    Projetos.find({ user: _id, parado: true }).lean().then((parado) => {
                                                                                        Projetos.find({ user: _id, foiRealizado: true }).lean().then((foirealizado) => {
                                                                                            res.render('relatorios/dashboardbi', { realizados, homologado, atrasado, executando, orcado, foirealizado, parado, checkFat, checkKwp, checkQtd, fatrural, fatresid, fatcomer, fatindus, fatsolo, fattelhado, fatmono, fatbifa, fattrif, fatnivel1, fatnivel2, fatnivel3, fatnivel4, fatnivel5, fatnivel6 })
                                                                                        })
                                                                                    })
                                                                                })
                                                                            })
                                                                        })
                                                                    })
                                                                })
                                                            }).catch((err) => {
                                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 6.')
                                                                res.redirect('/relatorios/dashboardbi')
                                                            })
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 5.')
                                                            res.redirect('/relatorios/dashboardbi')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 4.')
                                                        res.redirect('/relatorios/dashboardbi')
                                                    })
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 3.')
                                                    res.redirect('/relatorios/dashboardbi')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 2.')
                                                res.redirect('/relatorios/dashboardbi')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 1.')
                                            res.redirect('/relatorios/dashboardbi')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar usinas trifásicas.')
                                        res.redirect('/relatorios/dashboardbi')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar usinas bifásicas.')
                                    res.redirect('/relatorios/dashboardbi')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar usinas monofásicas.')
                                res.redirect('/relatorios/dashboardbi')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar usinas telhado.')
                            res.redirect('/relatorios/dashboardbi')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar usinas solo.')
                        res.redirect('/relatorios/dashboardbi')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar usinas industriais.')
                    res.redirect('/relatorios/dashboardbi')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar usinas comerciais.')
                res.redirect('/relatorios/dashboardbi')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar usinas residenciais.')
            res.redirect('/relatorios/dashboardbi')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar usinas rurais.')
        res.redirect('/relatorios/dashboardbi')
    })
})

router.get('/priorizacao', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    var lista_projetos = []
    var lista_compras = []
    var q = 0
    var qc = 0
    var dtprevisao
    var dtrecebimento
    Projeto.find({ user: id, ganho: true, encerrado: false, baixada: false }).sort({ data: 'asc' }).then((projetos) => {
        projetos.forEach((p) => {
            Cliente.findOne({ _id: p.cliente }).then((cli) => {
                q++
                lista_projetos.push({ id: p._id, seq: p.seq, cliente: cli.nome, data: dataMsgNum(p.data), nota: false, match: false })
                //console.log('q=>'+q)
                //console.log('propostas=>'+propostas.length)
                if (q == projetos.length) {
                    var nota
                    var recebido
                    lista_projetos.comparaNum()
                    if (naoVazio(compras)) {
                        compras.forEach((c) => {
                            Projeto.findOne({ _id: c.projeto }).then((projeto) => {
                                Cliente.findOne({ _id: projeto.cliente }).then((cli1) => {
                                    //console.log('c._id=>'+c._id)
                                    qc++
                                    //console.log('projeto.seq=>'+projeto.seq)
                                    //console.log('c.dtprevisao=>'+c.dtprevisao)
                                    if (naoVazio(c.dtprevisao)) {
                                        dtprevisao = c.dtprevisao
                                    } else {
                                        dtprevisao = '00000000'
                                    }

                                    if (naoVazio(c.dtrecebimento)) {
                                        dtrecebimento = c.dtrecebimento
                                        recebido = true
                                    } else {
                                        dtrecebimento = '0000-00-00'
                                        recebido = false
                                    }

                                    if (c.feitonota) {
                                        nota = true
                                    } else {
                                        nota = false
                                    }

                                    //console.log('dtprevisao=>'+dtprevisao)
                                    lista_compras.push({ id: projeto._id, seq: projeto.seq, cliente: cli1.nome, previsao: dataMsgNum(dtprevisao), recebimento: dataMensagem(dtrecebimento), recebido, nota, match: false })
                                    //console.log('qc=>'+qc)
                                    //console.log('compras.length=>'+compras.length)
                                    if (qc == compras.length) {
                                        //console.log('lista_projetos=>'+lista_projetos)
                                        var i
                                        lista_projetos.forEach((e) => {
                                            //console.log('e=>' + e.seq)
                                            //console.log('i=>' + i)
                                            i = 0
                                            while (i < lista_compras.length) {
                                                //console.log('e.seq=>' + e.seq)
                                                //console.log('lista_compras[i].seq=>' + lista_compras[i].seq)
                                                if (e.seq == lista_compras[i].seq) {
                                                    //console.log('encontrou')
                                                    e.match = true
                                                    lista_compras[i].match = true
                                                    //console.log('nota=>' + lista_compras[i].nota)
                                                    if (lista_compras[i].nota) {
                                                        e.nota = true
                                                    }
                                                    break
                                                }
                                                i++
                                            }
                                            //console.log('saiu do laço')
                                        })
                                        res.render('relatorios/priorizacao', { lista_projetos, lista_compras })
                                    }
                                }).catch((err) => {
                                    req.flash('error_msg', 'Nenhum cliente encontrado.')
                                    res.redirect('/menu')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhuma propostsa encontrada.')
                                res.redirect('/menu')
                            })
                        })
                    } else {
                        res.render('relatorios/priorizacao', { lista_projetos, lista_compras })
                    }
                }
            }).catch((err) => {
                req.flash('error_msg', 'Nenhum cliente encontrado.')
                res.redirect('/menu')
            })
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhum projeto encontrado par este filtro.')
        res.redirect('/menu')
    })
})

router.post('/analisar', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var dataini
    var datafim
    var dtinicio
    var dtfim
    var sql = {}
    var busca = []
    var buscapessoa = []

    var mestituloinicio
    var mestitulofim
    var anotituloinicio
    var anotitulofim

    var lista_ganho = []
    var lista_naoganho = []
    var lista_preco = []
    var lista_prazo = []
    var lista_finan = []
    var lista_conco = []
    var lista_smoti = []
    var lista_negoc = []
    var lista_anali = []
    var lista_compa = []
    var lista_reduc = []
    var lista_envia = []

    var totalGanho = 0
    var totalNaoGanho = 0
    var totalEnviado = 0
    var totalNegociando = 0
    var totalAberto = 0
    var totalPerdido = 0
    var totalPreco = 0
    var totalPrazo = 0
    var totalFinan = 0
    var totalNegoc = 0
    var totalConco = 0
    var totalSmoti = 0
    var totalAnali = 0
    var totalCompa = 0
    var totalReduc = 0

    var resp
    var baixado

    var q = 0

    var nomeCliente
    var nomeVendedor

    //console.log('req.body.dataini=>' + req.body.dataini)
    //console.log('req.body.datafim=>' + req.body.datafim)
    var cliente = req.body.cliente
    var vendedor = req.body.vendedor

    if (req.body.dataini == '' || req.body.datafim == '' || (dataBusca(req.body.dataini) > dataBusca(req.body.datafim))) {
        req.flash('error_msg', 'Verificar as datas de busca escolhidas.')
        if (req.body.tipo != '') {
            res.redirect('/dashboard/' + req.body.tipo)
        } else {
            res.redirect('/dashboard/')
        }
    }
    if (cliente == 'Todos') {
        clibusca = '111111111111111111111111'
    } else {
        clibusca = cliente
    }
    if (vendedor == 'Todos') {
        venbusca = '111111111111111111111111'
    } else {
        venbusca = vendedor
    }

    Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todas_pessoas) => {
        Cliente.find({ user: id }).lean().then((todos_clientes) => {
            Pessoa.findOne({ _id: venbusca }).then((nome_ven) => {
                Cliente.findOne({ _id: clibusca }).then((nome_cli) => {
                    // //console.log('nome_cli=>' + nome_cli)
                    // //console.log('nome_ven=>' + nome_ven)
                    if (nome_cli == null) {
                        nomeCliente = 'Todos'
                    } else {
                        nomeCliente = nome_cli.nome
                    }
                    if (nome_ven == null) {
                        nomeVendedor = 'Todos'
                    } else {
                        nomeVendedor = nome_res.nome
                    }

                    dataini = req.body.dataini
                    datafim = req.body.datafim
                    mestituloinicio = pegames(dataini.substring(5, 7))
                    mestitulofim = pegames(datafim.substring(5, 7))
                    anotituloinicio = dataini.substring(0, 4)
                    anotitulofim = datafim.substring(0, 4)
                    dataini = dataBusca(req.body.dataini)
                    datafim = dataBusca(req.body.datafim)

                    // //console.log('dataini=>' + dataini)
                    // //console.log('datafim=>' + datafim)
                    // //console.log('req.body.vendedor=>' + req.body.vendedor)
                    if (vendedor == 'Todos') {
                        buscapessoa = { user: id, vendedor: 'checked' }
                    } else {
                        buscapessoa = { user: id, _id: vendedor }
                    }
                    //console.log('buscapessoa=>' + buscapessoa)
                    Projeto.find({ user: id, datacad: { $lte: datafim, $gte: dataini } }).then((projeto) => {
                        if (naoVazio(projeto)) {
                            //console.log('projeto=>'+projeto)
                            Pessoa.find(buscapessoa).then((pessoa) => {
                                //console.log('pessoa=>' + pessoa)
                                pessoa.forEach((e) => {
                                    //console.log('e=>' + e)
                                    if (vendedor != 'Todos') {
                                        ven = e._id
                                    } else {
                                        ven = vendedor
                                    }
                                    //console.log('vendedor=>' + vendedor)
                                    //console.log('cliente=>' + cliente)
                                    if (vendedor == 'Todos' && cliente == 'Todos') {
                                        sql = { user: id, 'datacad': { $lte: datafim, $gte: dataini } }
                                    } else {
                                        if (vendedor != 'Todos' && cliente == 'Todos') {
                                            sql = { user: id, vendedor: vendedor, 'datacad': { $lte: datafim, $gte: dataini } }
                                        } else {
                                            if (vendedor == 'Todos' && cliente == 'Todos') {
                                                sql = { user: id, cliente: cliente, 'datacad': { $lte: datafim, $gte: dataini } }
                                            } else {
                                                if (vendedor != 'Todos' && cliente != 'Todos') {
                                                    sql = { user: id, cliente: cliente, vendedor: vendedor, 'datacad': { $lte: datafim, $gte: dataini } }
                                                }
                                            }
                                        }
                                    }
                                    //console.log('sql=>' + JSON.stringify(sql))
                                    Projeto.find(sql).sort({ datacad: 'asc' }).then((pr) => {
                                        if (naoVazio(pr)) {
                                            pr.forEach((p) => {
                                                //console.log('e._id=>' + e._id)
                                                q++
                                                if (p.baixada == true) {
                                                    baixado = 'Sim'
                                                } else {
                                                    baixado = 'Não'
                                                }

                                                if (naoVazio(p.dtinicio)) {
                                                    dtinicio = p.dtinicio
                                                } else {
                                                    dtinicio = '0000-00-00'
                                                }

                                                if (naoVazio(p.dtfim)) {
                                                    dtfim = p.dtfim
                                                } else {
                                                    dtfim = '0000-00-00'
                                                }

                                                if (naoVazio(p.motivo) && p.baixada == true) {
                                                    if (naoVazio(p.valor)) {
                                                        totalPerdido = totalPerdido + p.valor
                                                    }
                                                    if (p.motivo == 'Fechou com concorrente') {
                                                        lista_conco.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                        if (naoVazio(p.valor)) {
                                                            totalConco = totalConco + p.valor
                                                        }
                                                    }
                                                    if (p.motivo == 'Não conseguiu o financiamento') {
                                                        lista_finan.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                        if (naoVazio(p.valor)) {
                                                            totalFinan = totalFinan + p.valor
                                                        }
                                                    }
                                                    if (p.motivo == 'Preço elevado') {
                                                        lista_preco.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                        if (naoVazio(p.valor)) {
                                                            totalPreco = totalPreco + p.valor
                                                        }
                                                    }
                                                    if (p.motivo == 'Prazo de instalação') {
                                                        lista_prazo.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                        if (naoVazio(p.valor)) {
                                                            totalPrazo = totalPrazo + p.valor
                                                        }
                                                    }
                                                    if (p.motivo == 'Sem motivo') {
                                                        lista_smoti.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                        if (naoVazio(p.valor)) {
                                                            totalSmoti = totalSmoti + p.valor
                                                        }
                                                    }
                                                } else {
                                                    if (naoVazio(p.status) && p.ganho == false) {
                                                        if (naoVazio(p.valor)) {
                                                            totalAberto = totalAberto + p.valor
                                                        }
                                                        if (p.status == 'Enviado') {
                                                            lista_envia.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                            if (naoVazio(p.valor)) {
                                                                totalEnviado = totalEnviado + p.valor
                                                            }
                                                        }
                                                        if (p.status == 'Negociando') {
                                                            lista_negoc.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                            if (naoVazio(p.valor)) {
                                                                totalNegoc = totalNegoc + p.valor
                                                                totalNegociando = totalNegociando + p.valor
                                                            }
                                                        }
                                                        if (p.status == 'Analisando Financiamento') {
                                                            lista_anali.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                            if (naoVazio(p.valor)) {
                                                                totalAnali = totalAnali + p.valor
                                                                totalNegociando = totalNegociando + p.valor
                                                            }
                                                        }
                                                        if (p.status == 'Comparando Propostas') {
                                                            lista_compa.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                            if (naoVazio(p.valor)) {
                                                                totalCompa = totalCompa + p.valor
                                                                totalNegociando = totalNegociando + p.valor
                                                            }
                                                        }
                                                        if (p.status == 'Aguardando redução de preço') {
                                                            lista_reduc.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                            if (naoVazio(p.valor)) {
                                                                totalReduc = totalReduc + p.valor
                                                                totalNegociando = totalNegociando + p.valor
                                                            }
                                                        }
                                                    }
                                                }

                                                // if (p.feito == true) {
                                                //     lista_envio.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(equipe.dtinicio), datafim: dataMensagem(equipe.dtfim) })
                                                // }
                                                if (p.ganho == true) {
                                                    lista_ganho.push({ responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                    if (naoVazio(p.valor)) {
                                                        totalGanho = totalGanho + p.valor
                                                    }
                                                } else {
                                                    lista_naoganho.push({ baixado, responsavel: e.nome, projeto: p.seq, datacad: dataMsgNum(p.datacad), dataini: dataMensagem(dtinicio), datafim: dataMensagem(dtfim) })
                                                    if (naoVazio(p.valor)) {
                                                        totalNaoGanho = totalNaoGanho + p.valor
                                                    }
                                                }

                                                //console.log('q=>' + q)
                                                //console.log('projeto.length=>' + projeto.length)
                                                if (q == projeto.length) {

                                                    lista_ganho.sort(comparaNum)
                                                    lista_naoganho.sort(comparaNum)

                                                    var total = totalGanho + totalNaoGanho

                                                    res.render('relatorios/analiseproposta', {
                                                        todos_clientes, pessoa: todas_pessoas, lista_ganho, lista_naoganho,
                                                        qtd_conco: lista_conco.length, qtd_finan: lista_finan.length, qtd_preco: lista_preco.length, qtd_prazo: lista_prazo.length,
                                                        qtd_smoti: lista_smoti.length, qtd_negoc: lista_negoc.length, qtd_anali: lista_anali.length, qtd_compa: lista_compa.length,
                                                        qtd_reduc: lista_reduc.length, qtd_envia: lista_envia.length, naoganho_total: lista_naoganho.length, ganho_total: lista_ganho.length,
                                                        mestituloinicio, anotituloinicio, mestitulofim, anotitulofim, dataini: dataInput(dataini), datafim: dataInput(datafim),
                                                        totalEnviado: mascaraDecimal(totalEnviado),
                                                        totalNegociando: mascaraDecimal(totalNegociando),
                                                        totalPreco: mascaraDecimal(totalPreco),
                                                        totalPrazo: mascaraDecimal(totalPrazo),
                                                        totalFinan: mascaraDecimal(totalFinan),
                                                        totalNegoc: mascaraDecimal(totalNegoc),
                                                        totalConco: mascaraDecimal(totalConco),
                                                        totalSmoti: mascaraDecimal(totalSmoti),
                                                        totalAnali: mascaraDecimal(totalAnali),
                                                        totalCompa: mascaraDecimal(totalCompa),
                                                        totalReduc: mascaraDecimal(totalReduc),
                                                        totalGanho: mascaraDecimal(totalGanho),
                                                        totalNaoGanho: mascaraDecimal(totalNaoGanho),
                                                        totalAberto: mascaraDecimal(totalAberto),
                                                        total: mascaraDecimal(total)
                                                    })
                                                }
                                            })
                                        } else {
                                            res.render('relatorios/analiseproposta', { todos_clientes, pessoa: todas_pessoas, lista_ganho, lista_naoganho, lista_envio, qtd_envio, qtd_ganho, naoganho_total: lista_naoganho.length, ganho_total: lista_ganho.length, envio_total: lista_envio.length, mestituloinicio, anotituloinicio, mestitulofim, anotitulofim, dataini: dataInput(dataini), datafim: dataInput(datafim) })
                                        }
                                    })
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhuma pessoa encontrada.')
                                res.redirect('/relatorios/analiseproposta')
                            })
                        } else {
                            res.render('relatorios/analiseproposta', { todos_clientes, pessoa: todas_pessoas, lista_ganho, lista_naoganho, lista_envio, qtd_envio, qtd_ganho, naoganho_total: lista_naoganho.length, ganho_total: lista_ganho.length, envio_total: lista_envio.length, mestituloinicio, anotituloinicio, mestitulofim, anotitulofim, dataini: dataInput(dataini), datafim: dataInput(datafim) })
                        }
                    }).catch((err) => {
                        req.flash('error_msg', 'Nenhum projeto encontrado par este filtro.')
                        res.redirect('/relatorios/analiseproposta')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Nenhum cliente encontrado.')
                    res.redirect('/relatorios/analiseproposta')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Nenhuma responsável encontrado.')
                res.redirect('/relatorios/analiseproposta')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum cliente encontrado.')
            res.redirect('/relatorios/analiseproposta')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Nenhuma responsável encontrado.')
        res.redirect('/relatorios/analiseproposta')
    })
})

router.post('/aplicar', ehAdmin, (req, res) => {
    const { _id } = req.user

    var checkKwp
    var checkQtd
    var checkFat
    var fatrural = 0
    var fatresid = 0
    var fatcomer = 0
    var fatindus = 0
    var fatmono = 0
    var fatbifa = 0
    var fattrif = 0
    var fatnivel1 = 0
    var fatnivel2 = 0
    var fatnivel3 = 0
    var fatnivel4 = 0
    var fatnivel5 = 0
    var fatnivel6 = 0
    var qtdrural = 0
    var qtdresid = 0
    var qtdcomer = 0
    var qtdindus = 0
    var qtdmono = 0
    var qtdbifa = 0
    var qtdtrif = 0
    var qtdnivel1 = 0
    var qtdnivel2 = 0
    var qtdnivel3 = 0
    var qtdnivel4 = 0
    var qtdnivel5 = 0
    var qtdnivel6 = 0
    var kwprural = 0
    var kwpresid = 0
    var kwpcomer = 0
    var kwpindus = 0
    var kwpmono = 0
    var kwpbifa = 0
    var kwptrif = 0
    var kwpnivel1 = 0
    var kwpnivel2 = 0
    var kwpnivel3 = 0
    var kwpnivel4 = 0
    var kwpnivel5 = 0
    var kwpnivel6 = 0
    var fatsolo = 0
    var fattelhado = 0
    var qtdsolo = 0
    var qtdtelhado = 0
    var kwpsolo = 0
    var kwptelhado = 0

    var dataini
    var datafim
    var mestitulo = ''
    var ano = req.body.mesano
    switch (req.body.messel) {
        case 'Janeiro':
            dataini = ano + '01' + '01'
            datafim = ano + '01' + '31'
            mestitulo = 'Janeiro de '
            break;
        case 'Fevereiro':
            dataini = ano + '02' + '01'
            datafim = ano + '02' + '28'
            mestitulo = 'Fevereiro de '
            break;
        case 'Março':
            dataini = ano + '03' + '01'
            datafim = ano + '03' + '31'
            mestitulo = 'Março /'
            break;
        case 'Abril':
            dataini = ano + '04' + '01'
            datafim = ano + '04' + '30'
            mestitulo = 'Abril de '
            break;
        case 'Maio':
            dataini = ano + '05' + '01'
            datafim = ano + '05' + '31'
            mestitulo = 'Maio de '
            break;
        case 'Junho':
            dataini = ano + '06' + '01'
            datafim = ano + '06' + '30'
            mestitulo = 'Junho de '
            break;
        case 'Julho':
            dataini = ano + '07' + '01'
            datafim = ano + '07' + '31'
            mestitulo = 'Julho de '
            break;
        case 'Agosto':
            dataini = ano + '08' + '01'
            datafim = ano + '08' + '30'
            mestitulo = 'Agosto de '
            break;
        case 'Setembro':
            dataini = ano + '09' + '01'
            datafim = ano + '09' + '31'
            mestitulo = 'Setembro de '
            break;
        case 'Outubro':
            dataini = ano + '10' + '01'
            datafim = ano + '10' + '31'
            mestitulo = 'Outubro de '
            break;
        case 'Novembro':
            dataini = ano + '11' + '01'
            datafim = ano + '11' + '30'
            mestitulo = 'Novembro de '
            break;
        case 'Dezembro':
            dataini = ano + '12' + '01'
            datafim = ano + '12' + '31'
            mestitulo = 'Dezembro de '
            break;
        default:
            dataini = ano + '01' + '01'
            datafim = ano + '12' + '31'
            mestitulo = 'Todo ano de '
    }

    var selecionado = req.body.selecionado
    //console.log('selecionado=>' + selecionado)

    //console.log('dataini=>' + dataini)
    //console.log('datafim=>' + datafim)

    if (selecionado == 'faturamento') {
        checkFat = 'checked'
        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'classUsina': 'Rural' }, { 'classUsina': 'Rural Residencial' }, { 'classUsina': 'Rural Granja' }, { 'classUsina': 'Rural Irrigação' }] }).then((rural) => {
            for (i = 0; i < rural.length; i++) {
                fatrural = fatrural + parseFloat(rural[i].vlrNFS)
            }
            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Residencial' }).then((residencial) => {
                for (i = 0; i < residencial.length; i++) {
                    fatresid = fatresid + parseFloat(residencial[i].vlrNFS)
                }
                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Comercial' }).then((comercial) => {
                    for (i = 0; i < comercial.length; i++) {
                        fatcomer = fatcomer + parseFloat(comercial[i].vlrNFS)
                    }
                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Industrial' }).then((industrial) => {
                        for (i = 0; i < industrial.length; i++) {
                            fatindus = fatindus + parseFloat(industrial[i].vlrNFS)
                        }
                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Solo Concreto' }, { 'tipoUsina': 'Solo Metal' }, { 'tipoUsina': 'Laje' }] }).then((solo) => {
                            for (i = 0; i < solo.length; i++) {
                                fatsolo = fatsolo + parseFloat(solo[i].vlrNFS)
                            }
                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Telhado Fibrocimento' }, { 'tipoUsina': 'Telhado Madeira' }, { 'tipoUsina': 'Telhado Cerâmica' }, { 'tipoUsina': 'Telhado Gambrel' }] }).then((telhado) => {
                                for (i = 0; i < telhado.length; i++) {
                                    fattelhado = fattelhado + parseFloat(telhado[i].vlrNFS)
                                }
                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Monofásico 127V' }, { 'tipoConexao': 'Monofásico 220V' }] }).then((monofasico) => {
                                    for (i = 0; i < monofasico.length; i++) {
                                        fatmono = fatmono + parseFloat(monofasico[i].vlrNFS)
                                    }
                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, tipoConexao: 'Bifásico 220V' }).then((bifasico) => {
                                        for (i = 0; i < bifasico.length; i++) {
                                            fatbifa = fatbifa + parseFloat(bifasico[i].vlrNFS)
                                        }
                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Trifásico 220V' }, { 'tipoConexao': 'Trifásico 380V' }] }).then((trifasico) => {
                                            for (i = 0; i < trifasico.length; i++) {
                                                fattrif = fattrif + parseFloat(trifasico[i].vlrNFS)
                                            }
                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 10 } }).then((nivel1) => {
                                                for (i = 0; i < nivel1.length; i++) {
                                                    fatnivel1 = fatnivel1 + parseFloat(nivel1[i].vlrNFS)
                                                }
                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 30, $gte: 11 } }).then((nivel2) => {
                                                    for (i = 0; i < nivel2.length; i++) {
                                                        fatnivel2 = fatnivel2 + parseFloat(nivel2[i].vlrNFS)
                                                    }
                                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 50, $gte: 31 } }).then((nivel3) => {
                                                        for (i = 0; i < nivel3.length; i++) {
                                                            fatnivel3 = fatnivel3 + parseFloat(nivel3[i].vlrNFS)
                                                        }
                                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 100, $gte: 51 } }).then((nivel4) => {
                                                            for (i = 0; i < nivel4.length; i++) {
                                                                fatnivel4 = fatnivel4 + parseFloat(nivel4[i].vlrNFS)
                                                            }
                                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 150, $gte: 101 } }).then((nivel5) => {
                                                                for (i = 0; i < nivel5.length; i++) {
                                                                    fatnivel5 = fatnivel5 + parseFloat(nivel5[i].vlrNFS)
                                                                }
                                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 200, $gte: 151 } }).then((nivel6) => {
                                                                    for (i = 0; i < nivel6.length; i++) {
                                                                        fatnivel6 = fatnivel6 + parseFloat(nivel6[i].vlrNFS)
                                                                    }
                                                                    Realizado.find({ user: _id }).lean().then((realizados) => {
                                                                        Projetos.find({ user: _id, homologado: true }).lean().then((homologado) => {
                                                                            Projetos.find({ user: _id, atrasado: true }).lean().then((atrasado) => {
                                                                                Projetos.find({ user: _id, executando: true }).lean().then((executando) => {
                                                                                    Projetos.find({ user: _id, orcado: true }).lean().then((orcado) => {
                                                                                        Projetos.find({ user: _id, parado: true }).lean().then((parado) => {
                                                                                            Projetos.find({ user: _id, foiRealizado: true }).lean().then((foirealizado) => {
                                                                                                res.render('relatorios/dashboardbi', { realizados, homologado, atrasado, executando, orcado, foirealizado, parado, checkFat, checkKwp, checkQtd, fatrural, fatresid, fatcomer, fatindus, fatsolo, fattelhado, fatmono, fatbifa, fattrif, fatnivel1, fatnivel2, fatnivel3, fatnivel4, fatnivel5, fatnivel6, mestitulo, ano, selecionado })
                                                                                            })
                                                                                        })
                                                                                    })
                                                                                })
                                                                            })
                                                                        })
                                                                    })
                                                                }).catch((err) => {
                                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 6.')
                                                                    res.redirect('/relatorios/dashboardbi')
                                                                })
                                                            }).catch((err) => {
                                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 5.')
                                                                res.redirect('/relatorios/dashboardbi')
                                                            })
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 4.')
                                                            res.redirect('/relatorios/dashboardbi')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 3.')
                                                        res.redirect('/relatorios/dashboardbi')
                                                    })
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 2.')
                                                    res.redirect('/relatorios/dashboardbi')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 1.')
                                                res.redirect('/relatorios/dashboardbi')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Falha ao encontrar usinas trifásicas.')
                                            res.redirect('/relatorios/dashboardbi')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar usinas bifásicas.')
                                        res.redirect('/relatorios/dashboardbi')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar usinas monofásicas.')
                                    res.redirect('/relatorios/dashboardbi')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar usinas telhado.')
                                res.redirect('/relatorios/dashboardbi')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar usinas solo.')
                            res.redirect('/relatorios/dashboardbi')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar usinas industriais.')
                        res.redirect('/relatorios/dashboardbi')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar usinas comerciais.')
                    res.redirect('/relatorios/dashboardbi')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar usinas residenciais.')
                res.redirect('/relatorios/dashboardbi')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar usinas rurais.')
            res.redirect('/relatorios/dashboardbi')
        })

    } else {
        if (selecionado == 'quantidade') {
            checkQtd = 'checked'
            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'classUsina': 'Rural' }, { 'classUsina': 'Rural Residencial' }, { 'classUsina': 'Rural Granja' }, { 'classUsina': 'Rural Irrigação' }] }).then((rural) => {
                qtdrural = rural.length
                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Residencial' }).then((residencial) => {
                    qtdresid = residencial.length
                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Comercial' }).then((comercial) => {
                        qtdcomer = comercial.length
                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Industrial' }).then((industrial) => {
                            qtdindus = industrial.length
                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Solo Concreto' }, { 'tipoUsina': 'Solo Metal' }, { 'tipoUsina': 'Laje' }] }).then((solo) => {
                                qtdsolo = solo.length
                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Telhado Fibrocimento' }, { 'tipoUsina': 'Telhado Madeira' }, { 'tipoUsina': 'Telhado Cerâmica' }, { 'tipoUsina': 'Telhado Gambrel' }] }).then((telhado) => {
                                    qtdtelhado = telhado.length
                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Monofásico 127V' }, { 'tipoConexao': 'Monofásico 220V' }] }).then((monofasico) => {
                                        qtdmono = monofasico.length
                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, tipoConexao: 'Bifásico 220V' }).then((bifasico) => {
                                            qtdbifa = bifasico.length
                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Trifásico 220V' }, { 'tipoConexao': 'Trifásico 380V' }] }).then((trifasico) => {
                                                qtdtrif = trifasico.length
                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 10 } }).then((nivel1) => {
                                                    qtdnivel1 = nivel1.length
                                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 30, $gte: 11 } }).then((nivel2) => {
                                                        qtdnivel2 = nivel2.length
                                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 50, $gte: 31 } }).then((nivel3) => {
                                                            qtdnivel3 = nivel3.length
                                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 100, $gte: 51 } }).then((nivel4) => {
                                                                qtdnivel4 = nivel4.length
                                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 150, $gte: 101 } }).then((nivel5) => {
                                                                    qtdnivel5 = nivel5.length
                                                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 200, $gte: 151 } }).then((nivel6) => {
                                                                        qtdnivel6 = nivel6.length
                                                                        res.render('relatorios/dashboardbi', { checkFat, checkKwp, checkQtd, qtdrural, qtdresid, qtdcomer, qtdindus, qtdsolo, qtdtelhado, qtdmono, qtdbifa, qtdtrif, qtdnivel1, qtdnivel2, qtdnivel3, qtdnivel4, qtdnivel5, qtdnivel6, mestitulo, ano, selecionado })
                                                                    }).catch((err) => {
                                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 6.')
                                                                        res.redirect('/relatorios/dashboardbi')
                                                                    })
                                                                }).catch((err) => {
                                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 5.')
                                                                    res.redirect('/relatorios/dashboardbi')
                                                                })
                                                            }).catch((err) => {
                                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 4.')
                                                                res.redirect('/relatorios/dashboardbi')
                                                            })
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 3.')
                                                            res.redirect('/relatorios/dashboardbi')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 2.')
                                                        res.redirect('/relatorios/dashboardbi')
                                                    })
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 1.')
                                                    res.redirect('/relatorios/dashboardbi')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao encontrar usinas trifásicas.')
                                                res.redirect('/relatorios/dashboardbi')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Falha ao encontrar usinas bifásicas.')
                                            res.redirect('/relatorios/dashboardbi')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar usinas monofásicas.')
                                        res.redirect('/relatorios/dashboardbi')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar usinas telhado.')
                                    res.redirect('/relatorios/dashboardbi')
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar usinas solo.')
                                res.redirect('/relatorios/dashboardbi')
                            })

                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar usinas industriais.')
                            res.redirect('/relatorios/dashboardbi')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar usinas comerciais.')
                        res.redirect('/relatorios/dashboardbi')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar usinas residenciais.')
                    res.redirect('/relatorios/dashboardbi')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar usinas rurais.')
                res.redirect('/relatorios/dashboardbi')
            })
        } else {
            if (selecionado == 'potencia') {
                checkKwp = 'checked'
                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'classUsina': 'Rural' }, { 'classUsina': 'Rural Residencial' }, { 'classUsina': 'Rural Granja' }, { 'classUsina': 'Rural Irrigação' }] }).then((rural) => {
                    for (i = 0; i < rural.length; i++) {
                        kwprural = kwprural + parseFloat(rural[i].potencia)
                    }
                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Residencial' }).then((residencial) => {
                        for (i = 0; i < residencial.length; i++) {
                            kwpresid = kwpresid + parseFloat(residencial[i].potencia)
                        }
                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Comercial' }).then((comercial) => {
                            for (i = 0; i < comercial.length; i++) {
                                kwpcomer = kwpcomer + parseFloat(comercial[i].potencia)
                            }
                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, classUsina: 'Industrial' }).then((industrial) => {
                                for (i = 0; i < industrial.length; i++) {
                                    kwpindus = kwpindus + parseFloat(industrial[i].potencia)
                                }
                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Solo Concreto' }, { 'tipoUsina': 'Solo Metal' }, { 'tipoUsina': 'Laje' }] }).then((solo) => {
                                    for (i = 0; i < solo.length; i++) {
                                        kwpsolo = kwpsolo + parseFloat(solo[i].potencia)
                                    }
                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoUsina': 'Telhado Fibrocimento' }, { 'tipoUsina': 'Telhado Madeira' }, { 'tipoUsina': 'Telhado Cerâmica' }, { 'tipoUsina': 'Telhado Gambrel' }] }).then((telhado) => {
                                        for (i = 0; i < telhado.length; i++) {
                                            kwptelhado = kwptelhado + parseFloat(telhado[i].potencia)
                                        }
                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Monofásico 127V' }, { 'tipoConexao': 'Monofásico 220V' }] }).then((monofasico) => {
                                            for (i = 0; i < monofasico.length; i++) {
                                                kwpmono = kwpmono + parseFloat(monofasico[i].potencia)
                                            }
                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, tipoConexao: 'Bifásico 220V' }).then((bifasico) => {
                                                for (i = 0; i < bifasico.length; i++) {
                                                    kwpbifa = kwpbifa + parseFloat(bifasico[i].potencia)
                                                }
                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, $or: [{ 'tipoConexao': 'Trifásico 220V' }, { 'tipoConexao': 'Trifásico 380V' }] }).then((trifasico) => {
                                                    for (i = 0; i < trifasico.length; i++) {
                                                        kwptrif = kwptrif + parseFloat(trifasico[i].potencia)
                                                    }
                                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 10 } }).then((nivel1) => {
                                                        for (i = 0; i < nivel1.length; i++) {
                                                            kwpnivel1 = kwpnivel1 + parseFloat(nivel1[i].potencia)
                                                        }
                                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 30, $gte: 11 } }).then((nivel2) => {
                                                            for (i = 0; i < nivel2.length; i++) {
                                                                kwpnivel2 = kwpnivel2 + parseFloat(nivel2[i].potencia)
                                                            }
                                                            Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 50, $gte: 31 } }).then((nivel3) => {
                                                                for (i = 0; i < nivel3.length; i++) {
                                                                    kwpnivel3 = kwpnivel3 + parseFloat(nivel3[i].potencia)
                                                                }
                                                                Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 100, $gte: 51 } }).then((nivel4) => {
                                                                    for (i = 0; i < nivel4.length; i++) {
                                                                        kwpnivel4 = kwpnivel4 + parseFloat(nivel4[i].potencia)
                                                                    }
                                                                    Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 150, $gte: 101 } }).then((nivel5) => {
                                                                        for (i = 0; i < nivel5.length; i++) {
                                                                            kwpnivel5 = kwpnivel5 + parseFloat(nivel5[i].potencia)
                                                                        }
                                                                        Projetos.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini }, 'potencia': { $lte: 200, $gte: 151 } }).then((nivel6) => {
                                                                            for (i = 0; i < nivel6.length; i++) {
                                                                                kwpnivel6 = kwpnivel6 + parseFloat(nivel6[i].potencia)
                                                                            }
                                                                            res.render('relatorios/dashboardbi', { checkFat, checkKwp, checkQtd, kwprural, kwpresid, kwpcomer, kwpindus, kwpsolo, kwptelhado, kwpmono, kwpbifa, kwptrif, kwpnivel1, kwpnivel2, kwpnivel3, kwpnivel4, kwpnivel5, kwpnivel6, mestitulo, ano, selecionado })
                                                                        }).catch((err) => {
                                                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 6.')
                                                                            res.redirect('/relatorios/dashboardbi')
                                                                        })
                                                                    }).catch((err) => {
                                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 5.')
                                                                        res.redirect('/relatorios/dashboardbi')
                                                                    })
                                                                }).catch((err) => {
                                                                    req.flash('error_msg', 'Falha ao encontrar usinas nivel 4.')
                                                                    res.redirect('/relatorios/dashboardbi')
                                                                })
                                                            }).catch((err) => {
                                                                req.flash('error_msg', 'Falha ao encontrar usinas nivel 3.')
                                                                res.redirect('/relatorios/dashboardbi')
                                                            })
                                                        }).catch((err) => {
                                                            req.flash('error_msg', 'Falha ao encontrar usinas nivel 2.')
                                                            res.redirect('/relatorios/dashboardbi')
                                                        })
                                                    }).catch((err) => {
                                                        req.flash('error_msg', 'Falha ao encontrar usinas nivel 1.')
                                                        res.redirect('/relatorios/dashboardbi')
                                                    })
                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Falha ao encontrar usinas trifásicas.')
                                                    res.redirect('/relatorios/dashboardbi')
                                                })
                                            }).catch((err) => {
                                                req.flash('error_msg', 'Falha ao encontrar usinas bifásicas.')
                                                res.redirect('/relatorios/dashboardbi')
                                            })
                                        }).catch((err) => {
                                            req.flash('error_msg', 'Falha ao encontrar usinas monofásicas.')
                                            res.redirect('/relatorios/dashboardbi')
                                        })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar usinas telhado.')
                                        res.redirect('/relatorios/dashboardbi')
                                    })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar usinas solo.')
                                    res.redirect('/relatorios/dashboardbi')
                                })

                            }).catch((err) => {
                                req.flash('error_msg', 'Falha ao encontrar usinas industriais.')
                                res.redirect('/relatorios/dashboardbi')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Falha ao encontrar usinas comerciais.')
                            res.redirect('/relatorios/dashboardbi')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Falha ao encontrar usinas residenciais.')
                        res.redirect('/relatorios/dashboardbi')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar usinas rurais.')
                    res.redirect('/relatorios/dashboardbi')
                })
            } else {
                var aviso = []
                aviso.push({ texto: 'Nenhum registro encontrado.' })
                if (selecionado == 'faturamento') {
                    checkFat = 'checked'
                    checkQtd = 'unchecked'
                    checkKwp = 'unchecked'
                } else {
                    if (selecionado == 'quantidade') {
                        checkQtd = 'checked'
                        checkFat = 'unchecked'
                        checkKwp = 'unchecked'
                    } else {
                        checkKwp = 'checked'
                        checkQtd = 'unchecked'
                        checkFat = 'unchecked'
                    }
                }
                res.render('relatorios/dashboardbi/', { aviso, mestitulo, ano, checkFat, checkQtd, checkKwp })
            }
        }
    }
})

router.post('/imprimir', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var lista = []
    var busca = []
    var sql = []
    var data = []
    var encerrado = []
    var q = 0

    var responsavel
    var nome_insres
    var dif
    var data1
    var data2
    var dif

    var cliente = req.body.idcli
    var empresa = req.body.idemp
    var vendedor = req.body.idres
    var dataini = dataBusca(req.body.dataini)
    var datafim = dataBusca(req.body.datafim)
    //console.log(cliente)
    //console.log(empresa)
    //console.log(respons)
    //console.log(dataini)
    //console.log(datafim)

    data = { 'datacad': { $lte: datafim, $gte: dataini } }
    sql = filtrarProjeto(2, id, 'Todos', 'Todos', respons, empresa, cliente, false, false, false, false)
    encerrado = { encerrado: true }
    busca = Object.assign(data, sql, encerrado)
    Projeto.find(busca).then((projeto) => {
        projeto.forEach((e) => {
            //console.log('e=>' + e.id)
            Cliente.findOne({ _id: e.cliente }).lean().then((lista_cliente) => {
                Equipe.findOne({ _id: e.equipe, $and: [{ 'custoins': { $ne: 0 } }, { 'custoins': { $ne: null } }] }).then((equipe) => {
                    Pessoa.findOne({ _id: e.responsavel }).then((lista_responsavel) => {
                        Pessoa.findOne({ _id: equipe.insres }).then((insres) => {
                            q++
                            if (naoVazio(lista_responsavel)) {
                                responsavel = lista_responsavel.nome
                            } else {
                                responsavel = ''
                            }

                            if (naoVazio(insres)) {
                                nome_insres = insres.nome
                            } else {
                                nome_insres = ''
                            }
                            data1 = new Date(equipe.dtfim)
                            data2 = new Date(equipe.dtinicio)
                            dif = Math.abs(data1.getTime() - data2.getTime())
                            //console.log('dif=>'+dif)
                            days = Math.ceil(dif / (1000 * 60 * 60 * 24))
                            //console.log('dif=>'+dif)
                            custototal = parseFloat(equipe.custoins) * parseFloat(days)
                            lista.push({ id: e._id, seq: e.seq, cliente: lista_cliente.nome, responsavel, nome_insres, dataini: dataMensagem(equipe.dtinicio), datafim: dataMensagem(equipe.dtfim), custo: custototal, ins0: equipe.ins0, ins1: equipe.ins1, ins2: equipe.ins2, ins3: equipe.ins3, ins4: equipe.ins4, ins5: equipe.ins5 })
                            if (q == projeto.length) {
                                Pessoa.find({ user: id, $or: [{ 'funins': 'checked' }, { 'funele': 'checked' }] }).lean().then((instalador) => {
                                    res.render('relatorios/imprimirConsulta', { lista, instalador, respons, cliente, empresa, datafim, dataini })
                                }).catch((err) => {
                                    req.flash('error_msg', 'Falha ao encontrar os instaladores.')
                                    res.redirect('/dashboard/encerrado')
                                })
                            }
                        }).catch((err) => {
                            req.flash('error_msg', 'Nenhum técnico responsável encontrado.')
                            res.redirect('/dashboard/encerrado')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Nenhum gestor responsável encontrado')
                        res.redirect('/dashboard/encerrado')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Houve uma falha ao encontrar a equipe.')
                    res.redirect('/dashboard/encerrado')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Houve uma falha ao encontrar o cliente.')
                res.redirect('/dashboard/encerrado')
            })
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve uma falha ao encontrar a projeto.')
        res.redirect('/dashboard/encerrado')
    })
})

router.post('/filtraRelatorio', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var lista = []
    var busca = []
    var sql = []
    var data = []
    var encerrado = []
    var q = 0

    var responsavel
    var nome_insres
    var dif

    var cliente = req.body.cliente
    var empresa = req.body.empresa
    var respons = req.body.responsavel
    var dataini = req.body.dataini
    var datafim = req.body.datafim
    //console.log(cliente)
    //console.log(empresa)
    //console.log(respons)
    //console.log(dataini)
    //console.log(datafim)

    data = { 'datacad': { $lte: datafim, $gte: dataini } }
    sql = filtrarProjeto(2, id, 'Todos', 'Todos', respons, empresa, cliente, false, false, false, false)
    encerrado = { encerrado: true }
    busca = Object.assign(data, sql, encerrado)
    //console.log("req.body.ins=>" + req.body.ins)
    Pessoa.findOne({ _id: req.body.ins }).then((ins) => {
        Projeto.find(busca).then((projeto) => {
            projeto.forEach((e) => {
                //console.log('e=>' + e.id)
                Cliente.findOne({ _id: e.cliente }).lean().then((lista_cliente) => {
                    Equipe.findOne({ _id: e.equipe, $or: [{ 'idins0': ins }, { 'idins1': ins }, { 'idins2': ins }, { 'idins3': ins }, { 'idins4': ins }, { 'idins5': ins }], $and: [{ 'custoins': { $ne: 0 } }, { 'custoins': { $ne: null } }] }).then((equipe) => {
                        //console.log('equipe=>' + equipe)
                        Pessoa.findOne({ _id: e.responsavel }).then((lista_responsavel) => {
                            Pessoa.findOne({ _id: equipe.insres }).then((insres) => {
                                q++
                                if (naoVazio(lista_responsavel)) {
                                    responsavel = lista_responsavel.nome
                                } else {
                                    responsavel = ''
                                }

                                if (naoVazio(insres)) {
                                    nome_insres = insres.nome
                                } else {
                                    nome_insres = ''
                                }
                                dif = parseFloat(dataBusca(equipe.dtfim)) - parseFloat(dataBusca(equipe.dtinicio)) + 1
                                //console.log('dif=>'+dif)
                                custototal = parseFloat(ins.custo) * parseFloat(dif)
                                lista.push({ id: e._id, cliente: lista_cliente.nome, responsavel, nome_insres, dataini: dataMensagem(equipe.dtinicio), datafim: dataMensagem(equipe.dtfim), custo: custototal, ins0: ins.nome })
                                if (q == projeto.length) {
                                    Pessoa.find({ user: id, $or: [{ 'funins': 'checked' }, { 'funele': 'checked' }] }).lean().then((instalador) => {
                                        res.render('relatorios/imprimirConsulta', { lista, instalador, respons, cliente, empresa, datafim, dataini })
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Falha ao encontrar os instaladores.')
                                        res.redirect('/dashboard/encerrado')
                                    })
                                }
                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhum técnico responsável encontrado.')
                                res.redirect('/dashboard/encerrado')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Nenhum gestor responsável encontrado')
                            res.redirect('/dashboard/encerrado')
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve uma falha ao encontrar a equipe.')
                        res.redirect('/dashboard/encerrado')
                    })
                }).catch((err) => {
                    req.flash('error_msg', 'Houve uma falha ao encontrar o cliente.')
                    res.redirect('/dashboard/encerrado')
                })
            })
        }).catch((err) => {
            req.flash('error_msg', 'Houve uma falha ao encontrar a projeto.')
            res.redirect('/dashboard/encerrado')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve uma falha ao encontrar o instalador.')
        res.redirect('/dashboard/encerrado')
    })
})

router.post('/analiseGeral', ehAdmin, (req, res) => {
    const { _id } = req.user
    var potencia = 0
    var valor = 0
    var totint = 0
    var qtdmod = 0
    var custoPlano = 0
    var q = 0

    var dataini
    var datafim
    var mestitulo = ''
    var ano = req.body.mesano
    switch (req.body.messel) {
        case 'Janeiro':
            dataini = ano + '01' + '01'
            datafim = ano + '01' + '31'
            mestitulo = 'Janeiro de '
            break;
        case 'Fevereiro':
            dataini = ano + '02' + '01'
            datafim = ano + '02' + '28'
            mestitulo = 'Fevereiro de '
            break;
        case 'Março':
            dataini = ano + '03' + '01'
            datafim = ano + '03' + '31'
            mestitulo = 'Março /'
            break;
        case 'Abril':
            dataini = ano + '04' + '01'
            datafim = ano + '04' + '30'
            mestitulo = 'Abril de '
            break;
        case 'Maio':
            dataini = ano + '05' + '01'
            datafim = ano + '05' + '31'
            mestitulo = 'Maio de '
            break;
        case 'Junho':
            dataini = ano + '06' + '01'
            datafim = ano + '06' + '30'
            mestitulo = 'Junho de '
            break;
        case 'Julho':
            dataini = ano + '07' + '01'
            datafim = ano + '07' + '31'
            mestitulo = 'Julho de '
            break;
        case 'Agosto':
            dataini = ano + '08' + '01'
            datafim = ano + '08' + '30'
            mestitulo = 'Agosto de '
            break;
        case 'Setembro':
            dataini = ano + '09' + '01'
            datafim = ano + '09' + '31'
            mestitulo = 'Setembro de '
            break;
        case 'Outubro':
            dataini = ano + '10' + '01'
            datafim = ano + '10' + '31'
            mestitulo = 'Outubro de '
            break;
        case 'Novembro':
            dataini = ano + '11' + '01'
            datafim = ano + '11' + '30'
            mestitulo = 'Novembro de '
            break;
        case 'Dezembro':
            dataini = ano + '12' + '01'
            datafim = ano + '12' + '31'
            mestitulo = 'Dezembro de '
            break;
        default:
            dataini = ano + '01' + '01'
            datafim = ano + '12' + '31'
            mestitulo = 'Todo ano de '
    }

    Realizado.find({ user: _id, 'datareg': { $lte: datafim, $gte: dataini } }).sort({ datafim: 'asc' }).lean().then((realizado) => {
        realizado.forEach((element) => {
            Projetos.findOne({ _id: element.projeto }).then((projeto) => {
                if (projeto.ehDireto) {
                    if (projeto.qtdmod > 0) {
                        qtdmod = qtdmod + projeto.qtdmod
                    } else {
                        qtdmod = qtdmod + 0
                    }
                } else {
                    qtdmod = qtdmod + projeto.unimod
                }
                potencia = parseFloat(potencia) + parseFloat(element.potencia)

                valor = valor + element.valor
                totint = totint + element.totint
                custoPlano = custoPlano + element.custoPlano

                //console.log('q=>'+q)
                q = q + 1
                if (q == realizado.length) {
                    var rspmod = (parseFloat(valor) / parseFloat(qtdmod)).toFixed(2)
                    var rspkwp = (parseFloat(valor) / parseFloat(potencia)).toFixed(2)
                    var rsimod = (parseFloat(totint) / parseFloat(qtdmod)).toFixed(2)
                    var rsikwp = (parseFloat(totint) / parseFloat(potencia)).toFixed(2)
                    var custoPorModulo = (parseFloat(custoPlano) / parseFloat(qtdmod)).toFixed(2)
                    var custoPorKwp = (parseFloat(custoPlano) / parseFloat(potencia)).toFixed(2)
                    res.render('relatorios/analisegeral', { potencia, qtdmod, valor, rspkwp, rspmod, rsimod, rsikwp, custoPorModulo, custoPorKwp, mestitulo, ano })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro para encontrar projetos.')
                res.redirect('/menu')
            })
        })
        if (realizado.length == 0) {
            aviso = []
            aviso.push({ texto: 'Nenhum projeto realizado no período de: ' + mestitulo + ' de ' + ano })
            res.render('relatorios/analisegeral', { aviso, mestitulo, ano })
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro para encontrar projetos realizados.')
        res.redirect('/menu')
    })
})

router.post('/filtraInstalador', ehAdmin, async (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { ehAdmin } = req.user
    const { owner } = req.user
    const { pessoa } = req.user
    var id
    var q = 0

    var listaAberto = []
    var listaEncerrado = []
    var clientes = []

    if (naoVazio(user)) {
        id = user
    } else {
        id = _id
    }

    var hoje = dataHoje()
    var ano = hoje.substring(0, 4)

    if (ehAdmin == 0) {
        ehMaster = true
    } else {
        ehMaster = false
    }

    var clientes = []
    try {
        const instalador = await Pessoa.findById(pessoa)
        const nome_instalador = instalador.nome
        Projeto.aggregate(
            [
                {
                    $match: {
                        user: id,
                    }
                },
                {
                    $project: {
                        seq: 1,
                        endereco: 1,
                        cidade: 1,
                        _id: 1,
                        seq: 1,
                        uf: 1,
                        telhado: 1,
                        estrutura: 1,
                        inversor: 1,
                        plaQtdInv: 1,
                        plaWattMod: 1,
                        equipe: 1,
                        vendedor: 1,
                        cliente: 1
                    }
                },
                {
                    $lookup: {
                        from: "equipes",
                        let: { id_equipe: "$equipe" },
                        pipeline: [
                            {
                                $match: {
                                    insres: pessoa,
                                    feito: true,
                                    liberar: true,
                                    $expr: {
                                        $eq: ["$_id", "$$id_equipe"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    insres: 1,
                                    prjfeito: 1,
                                    ativo: 1,
                                    dtinicio: 1,
                                    dtfim: 1
                                }
                            }
                        ],
                        as: "equipe_projeto"
                    }
                },
                {
                    $lookup: {
                        from: "pessoas",
                        let: { id_vendedor: "$vendedor" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$id_vendedor"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    nome: 1
                                }
                            }
                        ],
                        as: "vendedor_projeto"
                    }
                },
                {
                    $lookup: {
                        from: "clientes",
                        let: { id_cliente: "$cliente" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$id_cliente"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    nome: 1,
                                    _id: 1
                                }
                            }
                        ],
                        as: "cliente_projeto"
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                { $arrayElemAt: ["$equipe_projeto", 0] },
                                { $arrayElemAt: ["$vendedor_projeto", 0] },
                                "$$ROOT"]
                        }
                    }
                },
                {
                    $project: {
                        vendedor_projeto: 0,
                        equipe_projeto: 0
                    }
                }
            ]
        ).then(async data => {
            data.map(async item => {
                try {
                    let id_cliente = await item.cliente_projeto[0]._id;
                    let nome_cliente = await item.cliente_projeto[0].nome;
                    clientes.push({ id: id_cliente, nome: nome_cliente });

                    let dtini = '00/00/0000';
                    let dtfim = '00/00/0000';
                    if (naoVazio(item.dtinicio)) {
                        dtini = dataMensagem(item.dtinicio);
                    }
                    if (naoVazio(item.dtfim)) {
                        dtfim = dataMensagem(item.dtfim);
                    }

                    if (id_cliente == req.body.cliente) {
                        if (item.prjfeito) {
                            listaEncerrado.push(
                                {
                                    ativo: item.ativo,
                                    id: item._id,
                                    seq: item.seq,
                                    cliente: nome_cliente,
                                    endereco: item.endereco,
                                    cidade: item.cidade,
                                    uf: item.uf,
                                    dtini: dtini,
                                    dtfim: dtfim
                                }
                            );
                        }
                        if (item.prjfeito == false) {
                            listaAberto.push(
                                {
                                    ativo: item.ativo,
                                    id: item._id,
                                    seq: item.seq,
                                    cliente: nome_cliente,
                                    endereco: item.endereco,
                                    cidade: item.cidade,
                                    uf: item.uf,
                                    vendedor: item.nome,
                                    telhado: item.telhado,
                                    estrutura: item.estrutura,
                                    inversor: item.plaKwpInv,
                                    modulos: item.plaQtdMod,
                                    potencia: item.plaWattMod,
                                    dtini: dtini,
                                    dtfim: dtfim
                                }
                            );
                        }
                    }

                } catch (error) {
                    console.log(error);
                }
            });

            const equipes = await Equipe.find(
                {
                    user: id,
                    insres: pessoa,
                    feito: true,
                    liberar: true,
                    nome_projeto: { $exists: true },
                    $and: [
                        {
                            'dtinicio': { $ne: '' }
                        },
                        {
                            'dtinicio': { $ne: '0000-00-00' }
                        }
                    ]
                });

            if (naoVazio(equipes)) {
                equipes.map(async item_equipe => {
                    try {
                        let projeto = await Projeto.findOne({ equipe: item_equipe._id });
                        let vendedor = await Pessoa.findById(projeto.vendedor);
                        let cliente = await Cliente.findById(projeto.cliente);

                        if (cliente._id == req.body.cliente) {
                            if (item_equipe.prjfeito) {
                                listaEncerrado.push(
                                    {
                                        ativo: item_equipe.ativo,
                                        id: projeto._id,
                                        seq: projeto.seq,
                                        cliente: cliente.nome,
                                        endereco: projeto.endereco,
                                        cidade: projeto.cidade,
                                        uf: projeto.uf,
                                        dtini: dataMensagem(item_equipe.dtinicio),
                                        dtfim: dataMensagem(item_equipe.dtfim)
                                    }
                                );
                            }
                            if (item_equipe.prjfeito == false) {
                                listaAberto.push(
                                    {
                                        ativo: item_equipe.ativo,
                                        id: projeto._id,
                                        seq: projeto.seq,
                                        cliente: nome_cliente,
                                        endereco: projeto.endereco,
                                        cidade: projeto.cidade,
                                        uf: projeto.uf,
                                        vendedor: vendedor.nome,
                                        telhado: projeto.telhado,
                                        estrutura: projeto.estrutura,
                                        inversor: projeto.plaKwpInv,
                                        modulos: projeto.plaQtdMod,
                                        potencia: projeto.plaWattMod,
                                        dtini: dataMensagem(item_equipe.dtinicio),
                                        dtfim: dataMensagem(item_equipe.dtfim)
                                    }
                                );
                            }
                        }
                    } catch (error) {
                        console.log(error);
                    }
                });
            }
            listaAberto.sort(comparaNum);
            listaEncerrado.sort(comparaNum);
            console.log(listaEncerrado);

            try {
                const ult_empresa = await Empresa.findOne().sort({ field: 'asc', _id: -1 })
                if (naoVazio(ult_empresa)) {
                    res.render('dashinsobra',
                        {
                            id: _id,
                            empresa: ult_empresa,
                            instalador: true,
                            vendedor: false,
                            orcamentista: false,
                            ehMaster,
                            owner: owner,
                            ano,
                            block: true,
                            nome: nome_instalador,
                            clientes,
                            listaAberto,
                            listaEncerrado
                        });
                } else {
                    res.render('dashinsobra',
                        {
                            id: _id,
                            instalador: true,
                            vendedor: false,
                            orcamentista: false,
                            ehMaster,
                            owner: owner,
                            ano,
                            block: true,
                            nome: nome_instalador,
                            clientes,
                            listaAberto,
                            listaEncerrado
                        });
                }
            } catch (error) {
                console.log(error);
            }
        });
    } catch (error) {
        console.log(error);
    }
})

router.post('/filtrar', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { funges } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var lista = []

    var dtcadastro = '0000-00-00'
    var dtinicio = '0000-00-00'
    var dtfim = '0000-00-00'
    var dataini = 0
    var datafim = 0
    var busca = {}
    var sql = {}
    var stats
    var valor = 0
    var total = 0
    var check2030 = ''
    var check3050 = ''
    var check50100 = ''
    var check100 = ''
    var checktudo = ''
    var filtravlr = String(req.body.valor)
    filtravlr = filtravlr.replace(',on', '')
    var sqlvlr = {}

    var funcaoGes

    var q = 0

    //console.log('req.body.dataini=>' + req.body.dataini)
    //console.log('req.body.datafim=>' + req.body.datafim)

    if (req.body.dataini == '' || req.body.datafim == '' || (dataBusca(req.body.dataini) > dataBusca(req.body.datafim))) {
        req.flash('error_msg', 'Verificar as datas de busca escolhidas.')
        res.redirect('/dashboard/')
    }

    console.log('filtravlr=>' + filtravlr)

    switch (filtravlr) {
        case '2030': sqlvlr = { 'valor': { $gte: 20000, $lte: 30000 } }
            check2030 = 'checked'
            break;
        case '3050': sqlvlr = { 'valor': { $gte: 30000, $lte: 50000 } }
            check3050 = 'checked'
            break;
        case '50100': sqlvlr = { 'valor': { $gte: 50000, $lte: 100000 } }
            check50100 = 'checked'
            break;
        case '100': sqlvlr = { 'valor': { $gte: 100000 } }
            check100 = 'checked'
            break;
        default: sqlvlr = {}
            checktudo = 'checked'
            break;
    }

    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
            stats = req.body.stats
            cliente = req.body.cliente
            vendedor = req.body.vendedor

            dataini = dataBusca(req.body.dataini)
            datafim = dataBusca(req.body.datafim)
        

            if (vendedor != 'Todos' && cliente != 'Todos' && stats != 'Todos') {
                sql = { user: id, cliente: cliente, vendedor: vendedor, status: stats }
            } else {
                if (vendedor != 'Todos' && cliente != 'Todos' && stats == 'Todos') {
                    sql = { user: id, cliente: cliente, vendedor: vendedor }
                } else {
                    if (vendedor != 'Todos' && cliente == 'Todos' && stats == 'Todos') {
                        sql = { user: id, vendedor: vendedor }
                    } else {
                        if (vendedor == 'Todos' && cliente != 'Todos' && stats == 'Todos') {
                            sql = { user: id, cliente: cliente }
                        } else {
                            if (vendedor == 'Todos' && cliente == 'Todos' && stats != 'Todos') {
                                if (stats == 'Negociando') {
                                    sql = { user: id, $or: [{ status: 'Negociando' }, { status: 'Analisando Financiamento' }, { status: 'Comparando Propostas' }, { status: 'Aguardando redução de preço' }] }
                                } else {
                                    sql = { user: id, status: stats }
                                }
                            } else {
                                if (vendedor != 'Todos' && cliente == 'Todos' && stats != 'Todos') {
                                    if (stats == 'Negociando') {
                                        sql = { user: id, vendedor: vendedor, $or: [{ status: 'Negociando' }, { status: 'Analisando Financiamento' }, { status: 'Comparando Propostas' }, { status: 'Aguardando redução de preço' }] }
                                    } else {
                                        sql = { user: id, vendedor: vendedor, status: stats }
                                    }
                                } else {
                                    if (vendedor == 'Todos' && cliente != 'Todos' && stats != 'Todos') {
                                        if (stats == 'Negociando') {
                                            sql = { user: id, cliente: cliente, $or: [{ status: 'Negociando' }, { status: 'Analisando Financiamento' }, { status: 'Comparando Propostas' }, { status: 'Aguardando redução de preço' }] }
                                        } else {
                                            sql = { user: id, cliente: cliente, status: stats }
                                        }
                                    } else {
                                        sql = { user: id }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (naoVazio(dataini) && naoVazio(datafim)) {
                var data = { 'datacad': { $lte: datafim, $gte: dataini } }
            }

            Object.assign(busca, sql, data, sqlvlr)

            console.log('busca=>' + JSON.stringify(busca))

            Projeto.find(busca).sort({ 'data': -1 }).then((projeto) => {

                if (naoVazio(projeto)) {
                    projeto.forEach((e) => {
                        Cliente.findOne({ _id: e.cliente }).then((prj_cliente) => {
                            Pessoa.findOne({ _id: e.vendedor }).then((prj_vendedor) => {
                                q++
                                //console.log('e.datacad=>' + e.datacad)
                                if (naoVazio(e.datacad)) {
                                    dtcadastro = e.datacad
                                } else {
                                    dtcadastro = '00000000'
                                }

                                if (naoVazio(e.dtinicio)) {
                                    dtinicio = e.dtinicio
                                } else {
                                    dtinicio = '0000-00-00'
                                }

                                if (naoVazio(e.dtfim)) {
                                    dtfim = e.dtfim
                                } else {
                                    dtfim = '0000-00-00'
                                }

                                if (naoVazio(prj_vendedor)) {
                                    nome_vendedor = prj_vendedor.nome
                                } else {
                                    nome_vendedor = ''
                                }

                                //console.log('valor=>' + valor)
                                if (naoVazio(e.valor)) {
                                    total = total + e.valor
                                    valor = e.valor
                                } else {
                                    valor = 0
                                }

                                lista.push({ s: e.status, id: e._id, seq: e.seq, uf: e.uf, cidade: e.cidade, dataini, datafim, valor: mascaraDecimal(valor), cliente: prj_cliente.nome, nome_vendedor, cadastro: dataMsgNum(dtcadastro), inicio: dataMensagem(dtinicio), fim: dataMensagem(dtfim) })

                                if (q == projeto.length) {
                                    //console.log(lista)
                                    if (naoVazio(user) == false) {
                                        funcaoGes = true
                                    } else {
                                        funcaoGes = funges
                                    }
                                    res.render('relatorios/consulta', {
                                        qtd: q, lista, todos_clientes, todos_vendedores, dataini, datafim, total: mascaraDecimal(total), stats, cliente, vendedor, inicio: dataini, fim: datafim, mostrar: '',
                                        check2030, check3050, check50100, check100, checktudo, funges: funcaoGes
                                    })
                                }

                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhum vendedor encontrado.')
                                res.redirect('/dashboard')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Nenhum cliente encontrado.')
                            res.redirect('/dashboard')
                        })
                    })
                } else {
                    if (naoVazio(user) == false) {
                        funcaoGes = true
                    } else {
                        funcaoGes = funges
                    }
                    req.flash('aviso_msg', 'Não existem registros no sistema.')
                    res.render('relatorios/consulta', {
                        lista, todos_clientes, todos_vendedores, stats, cliente, inicio: dataini, fim: datafim, mostrar: '',
                        check2030, check3050, check50100, check100, checktudo, funges: funcaoGes
                    })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Nenhum projeto encontrado.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum vendedor encontrado.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        res.redirect('/dashboard')
    })
})

router.post('/exportar/', ehAdmin, (req, res) => {

    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var busca = {}
    var sql = {}
    var lista = []
    var dados = []
    var valor = 0
    var total = 0
    var q = 0

    var stats = req.body.status
    var cliente = req.body.cliente
    var vendedor = req.body.vendedor
    var dtinicio = req.body.inicio
    var dtfim = req.body.fim
    var nome_vendedor
    var dtcadastro

    if (vendedor != 'Todos' && cliente != 'Todos' && stats != 'Todos') {
        sql = { user: id, cliente: cliente, vendedor: vendedor, status: stats }
    } else {
        if (vendedor != 'Todos' && cliente != 'Todos' && stats == 'Todos') {
            sql = { user: id, cliente: cliente, vendedor: vendedor, 'datacad': { $gte: dtinicio, $lte: dtfim } }
        } else {
            if (vendedor != 'Todos' && cliente == 'Todos' && stats == 'Todos') {
                sql = { user: id, vendedor: vendedor, 'datacad': { $gte: dtinicio, $lte: dtfim } }
            } else {
                if (vendedor == 'Todos' && cliente != 'Todos' && stats == 'Todos') {
                    sql = { user: id, cliente: cliente, 'datacad': { $gte: dtinicio, $lte: dtfim } }
                } else {
                    if (vendedor == 'Todos' && cliente == 'Todos' && stats != 'Todos') {
                        sql = { user: id, status: stats, 'datacad': { $gte: dtinicio, $lte: dtfim } }
                    } else {
                        if (vendedor != 'Todos' && cliente == 'Todos' && stats != 'Todos') {
                            sql = { user: id, vendedor: vendedor, 'datacad': { $gte: dtinicio, $lte: dtfim } }
                        } else {
                            if (vendedor == 'Todos' && cliente != 'Todos' && stats != 'Todos') {
                                sql = { user: id, cliente: cliente, 'datacad': { $gte: dtinicio, $lte: dtfim } }
                            } else {
                                sql = { user: id, 'datacad': { $gte: dtinicio, $lte: dtfim } }
                            }
                        }
                    }
                }
            }
        }
    }
    //console.log('sql=>' + JSON.stringify(sql))
    Cliente.find({ user: id }).lean().then((todos_clientes) => {
        Pessoa.find({ user: id, vendedor: 'checked' }).lean().then((todos_vendedores) => {
            Projeto.find(sql).sort({ 'data': -1 }).then((projeto) => {
                if (naoVazio(projeto)) {
                    projeto.forEach((e) => {
                        //console.log('cliente=>'+e.cliente)
                        Cliente.findOne({ _id: e.cliente }).then((cliente) => {
                            //console.log('cliente=>'+e.vendedor)
                            Pessoa.findOne({ _id: e.vendedor }).then((vendedor) => {
                                q++

                                if (naoVazio(e.datacad)) {
                                    dtcadastro = e.datacad
                                } else {
                                    dtcadastro = '00000000'
                                }

                                if (naoVazio(e.dtinicio)) {
                                    dtinicio = e.dtinicio
                                } else {
                                    dtinicio = '0000-00-00'
                                }

                                if (naoVazio(e.dtfim)) {
                                    dtfim = e.dtfim
                                } else {
                                    dtfim = '0000-00-00'
                                }

                                if (naoVazio(vendedor)) {
                                    nome_vendedor = vendedor.nome
                                } else {
                                    nome_vendedor = ''
                                }

                                //console.log('e.valor=>' + e.valor)
                                if (naoVazio(e.valor)) {
                                    valor = e.valor
                                    total = total + e.valor
                                } else {
                                    valor = 0
                                }

                                dados.push({ s: String(e.status), seq: String(e.seq), uf: String(e.uf), cidade: String(e.cidade), cliente: String(cliente.nome), nome_vendedor, valor: String(mascaraDecimal(valor)), cadastro: String(dataMsgNum(dtcadastro)), inicio: String(dataMensagem(dtinicio)), fim: String(dataMensagem(dtfim)) })
                                lista.push({ s: String(e.status), id: e._id, seq: String(e.seq), uf: String(e.uf), cidade: String(e.cidade), valor: String(mascaraDecimal(valor)), cliente: String(cliente.nome), nome_vendedor, cadastro: String(dataMsgNum(dtcadastro)), inicio: String(dataMensagem(dtinicio)), fim: String(dataMensagem(dtfim)) })
                                //console.log("q=>" + q)
                                //console.log("projeto.length=>" + projeto.length)
                                if (q == projeto.length) {
                                    //console.log('lista=>' + lista)
                                    const wb = new xl.Workbook()
                                    const ws = wb.addWorksheet('Relatório')
                                    const headingColumnNames = [
                                        "Status",
                                        "Proposta",
                                        "UF",
                                        "Cidade",
                                        "Cliente",
                                        "Vendedor",
                                        "Valor",
                                        "Cadastro",
                                        "Inicio Instalação",
                                        "Fim Instalação",
                                    ]
                                    var headingColumnIndex = 1; //diz que começará na primeira linha
                                    headingColumnNames.forEach(heading => { //passa por todos itens do array
                                        //cria uma célula do tipo string para cada título
                                        ws.cell(1, headingColumnIndex++).string(heading)
                                    })
                                    var rowIndex = 2 //começa na linha 2
                                    dados.forEach(record => { //passa por cada item do data
                                        var columnIndex = 1; //diz para começar na primeira coluna
                                        //console.log('transforma cada objeto em um array onde cada posição contém as chaves do objeto (name, email, cellphone)')
                                        Object.keys(record).forEach(columnName => {
                                            //cria uma coluna do tipo string para cada item
                                            ws.cell(rowIndex, columnIndex++).string(record[columnName])
                                        });
                                        rowIndex++; //incrementa o contador para ir para a próxima linha
                                    })
                                    rowIndex++
                                    ws.cell(rowIndex, 6).string('Total Valor R$:')
                                    ws.cell(rowIndex, 7).string(String(total))
                                    ws.cell(rowIndex, 2).string('Quantidade Total: ' + String(q))
                                    var time = new Date()
                                    var arquivo = 'relatorio_propostas_' + dataHoje() + time.getTime() + '.xlsx'
                                    //console.log('arquivi=>' + arquivo)
                                    // var sucesso = []
                                    // sucesso.push({texto: 'Relatório exportado com sucesso.'})
                                    wb.writeToBuffer().then(function (buffer) {
                                        //console.log('buffer excel')
                                        res
                                            .set('content-disposition', `attachment; filename="${arquivo}";  filename*=UTF-8''${encodeURI(arquivo)}`) // filename header
                                            .type('.xlsx') // setting content-type to xlsx. based on file extention
                                            .send(buffer)
                                        //.render('principal/consulta', { qtd: q, lista, todos_clientes, todos_vendedores, total: mascaraDecimal(total), stats, vendedor, cliente, inicio: dtinicio, fim: dtfim, mostrar: '', sucesso })
                                    })
                                    // var dir = __dirname
                                    // dir = dir.replace('routes','')
                                    // const file = `${dir}/upload/'`+arquivo;
                                    // res.download(file)
                                }
                            }).catch((err) => {
                                req.flash('error_msg', 'Nenhum vendedor encontrado.')
                                res.redirect('/relatorios/consulta')
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Nenhum cliente encontrado.')
                            res.redirect('/relatorios/consulta')
                        })
                    })
                } else {
                    req.flash('error_msg', 'Nenhum projeto encontrado.')
                    res.redirect('/relatorios/consulta')
                }
            }).catch((err) => {
                req.flash('error_msg', 'Nenhum projeto encontrado.')
                res.redirect('/relatorios/consulta')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Nenhum vendedor encontrado.')
            res.redirect('/relatorios/consulta')
        })
    }).catch((err) => {
        res.redirect('/relatorios/consulta')
    })
});

module.exports = router