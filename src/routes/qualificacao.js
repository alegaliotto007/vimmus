const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

require('../model/Projeto');

const { ehAdmin } = require('../helpers/ehAdmin');

const Projeto = mongoose.model('projeto');

const dataBusca = require('../resources/dataBusca');
const dataHoje = require('../resources/dataHoje');
const naoVazio = require('../resources/naoVazio');
const mascaraDecimal = require('../resources/mascaraDecimal');
const comparaNum = require('../resources/comparaNumeros');

router.get('/selecao', ehAdmin, (req, res) => {

    let id
    const { _id } = req.user
    const { user } = req.user
    const { pessoa } = req.user
    const { vendedor } = req.user
    const { funges } = req.user

    let ehMaster

    if (naoVazio(user)) {
        id = user
        ehMaster = false
    } else {
        id = _id
        ehMaster = true
    }

    let enviado = []
    let negociando = []
    let baixado = []
    let ganho = []
    let totEnviado = 0
    let totNegociando = 0
    let totPerdido = 0
    let totGanho = 0
    var totAnalise = 0;
    var totComparando = 0;
    var totPreco = 0;

    let hoje = dataHoje()
    let mes = hoje.substring(5, 7)
    let ano = hoje.substring(0, 4)
    let cliente

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

    let mestitulo = ''
    let diaini = '01'
    let diafim = ''

    let match = {}

    switch (String(mes)) {
        case '01':
            janeiro = 'active'
            mestitulo = 'Janeiro'
            diafim = '31'
            break;
        case '02':
            fevereiro = 'active'
            mestitulo = 'Fevereiro'
            diafim = '28'
            break;
        case '03':
            marco = 'active'
            mestitulo = 'Março'
            diafim = '31'
            break;
        case '04':
            abril = 'active'
            mestitulo = 'Abril'
            diafim = '30'
            break;
        case '05':
            maio = 'active'
            mestitulo = 'Maio'
            diafim = '31'
            break;
        case '06':
            junho = 'active'
            mestitulo = 'Junho'
            diafim = '30'
            break;
        case '07':
            julho = 'active'
            mestitulo = 'Julho'
            diafim = '31'
            break;
        case '08':
            agosto = 'active'
            mestitulo = 'Agosto'
            diafim = '31'
            break;
        case '09':
            setembro = 'active'
            diafim = '30'
            break;
        case '10':
            outubro = 'active'
            mestitulo = 'Outubro'
            diafim = '31'
            break;
        case '11':
            novembro = 'active'
            mestitulo = 'Novembro'
            diafim = '30'
            break;
        case '12':
            dezembro = 'active'
            mestitulo = 'Dezembro'
            diafim = '31'
            break;
    }

    let dataini = String(ano) + String(mes) + diaini
    let datafim = String(ano) + String(mes) + diafim

    if (naoVazio(vendedor)) {
        match = { user: id, vendedor: pessoa }
    } else {
        match = { user: id }
    }
    Projeto.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: 'clientes',
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
                            nome: 1
                        }
                    }],
                as: 'clientes'
            }
        },
        {
            $lookup: {
                from: 'pedidos',
                let: {
                    id_pedido: "$pedido"
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: ["$_id", "$$id_pedido"]
                        }
                    }
                },
                {
                    $project: { data: 1 }
                }
                ],
                as: "pedidos"
            }
        },
        {
            $project: {
                seq: 1,
                status: 1,
                ganho: 1,
                baixada: 1,
                valor: 1,
                clientes: 1,
                datacad: 1,
                pedidos: 1
            }
        }
    ]).then(result => {
        result.map(item => {
            let dataCliente = item.clientes
            dataCliente.map(i => cliente = i.nome);
            if (item.status == 'Enviado' && item.ganho == false && naoVazio(item.motivo) == false) {
                if (item.datacad < parseFloat(datafim) && item.datacad > parseFloat(dataini)) {
                    if (naoVazio(item.valor)) {
                        totEnviado = totEnviado + item.valor;
                    }
                    enviado.push({ id: item._id, cliente, seq: item.seq, status: item.status });
                }
            }

            let database = item.datacad;
            let dataPedido = item.pedidos;
            if (dataPedido.length > 0) {
                dataPedido.map(i => database = dataBusca(i.data));
            }
            if (item.ganho == true) {
                if (database < parseFloat(datafim) && database > parseFloat(dataini)) {
                    if (naoVazio(item.valor)) {
                        totGanho = totGanho + item.valor;
                    }
                    ganho.push({ id: item._id, cliente, seq: item.seq, status: item.status });
                }
            } else {
                if (item.datacad < parseFloat(datafim) && item.datacad > parseFloat(dataini)) {
                    if (item.baixada == true) {
                        if (naoVazio(item.valor)) {
                            totPerdido = totPerdido + item.valor;
                        }
                        baixado.push({ id: item._id, cliente, seq: item.seq, status: item.status, motivo: item.motivo })
                    } else {
                        if (item.status == 'Negociando' || item.status == 'Analisando Financiamento' || item.status == 'Comparando Propostas' || item.status == 'Aguardando redução de preço') {
                            if (naoVazio(item.valor)) {
                                if (item.status == 'Comparando Propostas') {
                                    totComparando = totComparando + item.valor;
                                }
                                if (item.status == 'Analisando Financiamento') {
                                    totAnalise = totAnalise + item.valor;
                                }
                                if (item.status == 'Aguardando redução de preço') {
                                    totPreco = totPreco + item.valor;
                                }
                                totNegociando = totNegociando + item.valor;
                            }
                            negociando.push({ id: item._id, cliente, seq: item.seq, status: item.status });
                        }
                    }
                }
            }
        })

        totEnviado = mascaraDecimal(totEnviado);
        totGanho = mascaraDecimal(totGanho);
        totPerdido = mascaraDecimal(totPerdido);
        totNegociando = mascaraDecimal(totNegociando);

        enviado.sort(comparaNum);
        negociando.sort(comparaNum);
        ganho.sort(comparaNum);
        baixado.sort(comparaNum);

        //console.log('totComparando=>' + totComparando)
        if (naoVazio(totComparando)) {
            totComparando = mascaraDecimal(totComparando);
        }
        if (naoVazio(totAnalise)) {
            totAnalise = mascaraDecimal(totAnalise);
        }
        if (naoVazio(totPreco)) {
            totPreco = mascaraDecimal(totPreco);
        }
        let numdiaini = parseFloat(diaini);
        let numdiafim = parseFloat(diafim);
        res.render('principal/selecao', {
            enviado, negociando, ganho, baixado, mestitulo, ano, numdiaini, numdiafim,
            janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro, todos,
            totEnviado, totGanho, totPerdido, totNegociando, totComparando, totAnalise, totPreco, funges, ehMaster
        })
    })
});

router.post('/aplicaSelecao', ehAdmin, (req, res) => {
    let id
    const { _id } = req.user
    const { user } = req.user
    const { funges } = req.user
    const { vendedor } = req.user
    const { pessoa } = req.user

    let ehMaster

    if (naoVazio(user)) {
        id = user
        ehMaster = false
    } else {
        id = _id
        ehMaster = true
    }

    let enviado = []
    let negociando = []
    let baixado = []
    let ganho = []
    let totEnviado = 0;
    let totNegociando = 0;
    let totPerdido = 0;
    let totGanho = 0;
    var totAnalise = 0;
    var totComparando = 0;
    var totPreco = 0;

    let dataini
    let datafim
    let ano = req.body.ano
    let mes = req.body.mes
    let mestitulo = ''
    let diaini = '01'
    let diafim;

    let cliente

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

    let match = {}

    switch (String(mes)) {
        case 'Janeiro':
            janeiro = 'active'
            mestitulo = 'Janeiro'
            mes = '01'
            diafim = '31'
            break;
        case 'Fevereiro':
            fevereiro = 'active'
            mestitulo = 'Fevereiro'
            mes = '02'
            diafim = '28'
            break;
        case 'Março':
            marco = 'active'
            mestitulo = 'Março'
            mes = '03'
            diafim = '31'
            break;
        case 'Abril':
            abril = 'active'
            mestitulo = 'Abril'
            mes = '04'
            diafim = '30'
            break;
        case 'Maio':
            maio = 'active'
            mestitulo = 'Maio'
            mes = '05'
            diafim = '31'
            break;
        case 'Junho':
            junho = 'active'
            mestitulo = 'Junho'
            mes = '06'
            diafim = '30'
            break;
        case 'Julho':
            julho = 'active'
            mestitulo = 'Julho'
            mes = '07'
            diafim = '31'
            break;
        case 'Agosto':
            agosto = 'active'
            mestitulo = 'Agosto'
            mes = '08'
            diafim = '31'
            break;
        case 'Setembro':
            setembro = 'active'
            mestitulo = 'Setembro'
            mes = '09'
            diafim = '30'
            break;
        case 'Outubro':
            outubro = 'active'
            mestitulo = 'Outubro'
            mes = '10'
            diafim = '31'
            break;
        case 'Novembro':
            novembro = 'active'
            mestitulo = 'Novembro'
            mes = '11'
            diafim = '30'
            break;
        case 'Dezembro':
            dezembro = 'active'
            mestitulo = 'Dezembro'
            mes = '12'
            diafim = '31'
            break;
        case 'Todos':
            todos = 'active'
            mestitulo = 'Todos'
            dataini = String(ano) + '01' + '01'
            datafim = String(ano) + '12' + '31'
            break;
    }

    if (String(mes) != 'Todos') {
        if (naoVazio(req.body.diafim)) {
            if (req.body.diafim < 10) {
                diafim = "0" + String(req.body.diafim)
            } else {
                diafim = String(req.body.diafim)
            }
        }
        if (naoVazio(req.body.diaini)) {
            if (req.body.diaini < 10) {
                diaini = "0" + String(req.body.diaini)
            } else {
                diaini = String(req.body.diaini)
            }
        }
        dataini = String(ano) + mes + diaini
        datafim = String(ano) + mes + diafim
    }


    if (naoVazio(vendedor)) {
        match = { user: id, vendedor: pessoa }
    } else {
        match = { user: id }
    }

    Projeto.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: 'clientes',
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
                            nome: 1
                        }
                    }],
                as: 'clientes'
            }
        },
        {
            $lookup: {
                from: 'pedidos',
                let: {
                    id_pedido: "$pedido"
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: ["$_id", "$$id_pedido"]
                        }
                    }
                },
                {
                    $project: { data: 1 }
                }
                ],
                as: "pedidos"
            }
        },
        {
            $project: {
                seq: 1,
                status: 1,
                ganho: 1,
                baixada: 1,
                valor: 1,
                datacad: 1,
                clientes: 1,
                pedidos: 1
            }
        }
    ]).then(result => {
        result.map(item => {
            let dataCliente = item.clientes
            dataCliente.map(i => cliente = i.nome);
            //console.log(cliente);
            if (item.status == 'Enviado' && item.ganho == false && naoVazio(item.motivo) == false) {
                if (item.datacad < parseFloat(datafim) && item.datacad > parseFloat(dataini)) {
                    if (naoVazio(item.valor)) {
                        totEnviado = totEnviado + item.valor;
                    }
                    enviado.push({ id: item._id, cliente, seq: item.seq, status: item.status });
                }
            }

            let database = item.datacad;
            let dataPedido = item.pedidos;
            if (dataPedido.length > 0) {
                dataPedido.map(i => database = dataBusca(i.data));
                //console.log('item.datacad=>' + item.datacad)
                //console.log('item.pedidos.data=>' + item.pedidos.data)
            }
            if (item.ganho == true) {
                if (database < parseFloat(datafim) && database > parseFloat(dataini)) {
                    if (naoVazio(item.valor)) {
                        totGanho = totGanho + item.valor;
                    }
                    ganho.push({ id: item._id, cliente, seq: item.seq, status: item.status });
                }
            } else {
                if (item.datacad < parseFloat(datafim) && item.datacad > parseFloat(dataini)) {
                    if (item.baixada == true) {
                        if (naoVazio(item.valor)) {
                            totPerdido = totPerdido + item.valor
                        }
                        baixado.push({ id: item._id, cliente, seq: item.seq, status: item.status, motivo: item.motivo })
                    } else {
                        if (item.status == 'Negociando' || item.status == 'Analisando Financiamento' || item.status == 'Comparando Propostas' || item.status == 'Aguardando redução de preço') {
                            var totAnalise = 0
                            var totComparando = 0
                            var totPreco = 0
                            if (naoVazio(item.valor)) {
                                if (item.status == 'Comparando Propostas') {
                                    totComparando = totComparando + item.valor
                                }
                                if (item.status == 'Analisando Financiamento') {
                                    totAnalise = totAnalise + item.valor
                                }
                                if (item.status == 'Aguardando redução de preço') {
                                    totPreco = totPreco + item.valor
                                }
                                totNegociando = totNegociando + item.valor
                            }
                            negociando.push({ id: item._id, cliente, seq: item.seq, status: item.status })
                        }
                    }
                }
            }
        })

        totEnviado = mascaraDecimal(totEnviado)
        totGanho = mascaraDecimal(totGanho)
        totPerdido = mascaraDecimal(totPerdido)
        totNegociando = mascaraDecimal(totNegociando)

        enviado.sort(comparaNum)
        negociando.sort(comparaNum)
        ganho.sort(comparaNum)
        baixado.sort(comparaNum)

        //console.log('totComparando=>' + totComparando)
        if (naoVazio(totComparando)) {
            totComparando = mascaraDecimal(totComparando)
        }
        if (naoVazio(totAnalise)) {
            totAnalise = mascaraDecimal(totAnalise)
        }
        if (naoVazio(totPreco)) {
            totPreco = mascaraDecimal(totPreco)
        }
        let numdiaini = parseFloat(diaini);
        let numdiafim = parseFloat(diafim);
        res.render('principal/selecao', {
            enviado, negociando, ganho, baixado, mestitulo, ano, numdiaini, numdiafim,
            janeiro, fevereiro, marco, abril, maio, junho, julho, agosto, setembro, outubro, novembro, dezembro, todos,
            totEnviado, totGanho, totPerdido, totNegociando, totComparando, totAnalise, totPreco, funges, ehMaster
        })
    })
});

router.post('/selecao', ehAdmin, (req, res) => {
    var idneg = []
    var idbax = []
    var idgan = []
    idneg = req.body.idneg
    idbax = req.body.idbax
    idgan = req.body.idgan

    //console.log("idgan=>" + idgan)

    if (naoVazio(idneg)) {
        if (idneg.length > 0) {
            for (i = 0; i < idneg.length; i++) {
                seq = idneg[i].split(' - ')
                Projeto.findOne({ seq: seq[0] }).then((pn) => {
                    pn.status = 'Negociando'
                    pn.save()
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a projeto')
                    res.redirect('/')
                })
            }
        }
    }

    if (naoVazio(idbax)) {
        if (idbax.length > 0) {
            for (i = 0; i < idbax.length; i++) {
                seq = idbax[i].split(' - ')
                Projeto.findOne({ seq: seq[0] }).then((pb) => {
                    pb.baixada = true
                    if (naoVazio(pb.motivo) == false) {
                        pb.motivo = 'Sem motivo'
                    }
                    pb.dtbaixa = dataHoje()
                    pb.save()
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a projeto<selecao>.')
                    res.redirect('/')
                })
            }
        }
    }
    //console.log('idgan.length=>' + idgan.length)
    if (naoVazio(idgan)) {
        if (idgan.length > 0) {
            for (i = 0; i < idgan.length; i++) {
                //console.log('idgan[i]=>' + idgan[i])
                seq = idgan[i].split(' - ')
                //console.log('seq=>' + seq[0])
                Projeto.findOne({ seq: seq[0] }).then((pg) => {
                    pg.ganho = true
                    pg.save()
                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar a projeto')
                    res.redirect('/')
                })
            }
        }
    }

    res.redirect('/gerenciamento/selecao')
});

module.exports = router;

