const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { google } = require('googleapis')
require('dotenv').config()

require('../model/Cliente')
require('../model/Agenda')
require('../model/Projeto')

const { ehAdmin } = require('../helpers/ehAdmin')
// Provide the required configuration
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Google calendar API settings
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const calendar = google.calendar({ version: "v3" });

const auth = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    SCOPES
)

const Agenda = mongoose.model('agenda')
const Cliente = mongoose.model('cliente')
const Projeto = mongoose.model('projeto')

const naoVazio = require('../resources/naoVazio')

router.post('/vermais/', ehAdmin, (req, res) => {
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
    var mestitulo = req.body.mes

    switch (mestitulo) {
        case 'Janeiro':
            janeiro = 'active'
            meshoje = '01'
            break;
        case 'Fevereiro':
            fevereiro = 'active'
            meshoje = '02'
            bisexto = true
            break;
        case 'Março':
            marco = 'active'
            meshoje = '03'
            break;
        case 'Abril':
            abril = 'active'
            meshoje = '04'
            break;
        case 'Maio':
            maio = 'active'
            meshoje = '05'
            break;
        case 'Junho':
            junho = 'active'
            meshoje = '06'
            break;
        case 'Julho':
            julho = 'active'
            meshoje = '07'
            break;
        case 'Agosto':
            agosto = 'active'
            meshoje = '08'
            break;
        case 'Setembro':
            setembro = 'active'
            meshoje = '09'
            break;
        case 'Outubro':
            outubro = 'active'
            meshoje = '10'
            break;
        case 'Novembro':
            novembro = 'active'
            meshoje = '11'
            break;
        case 'Dezembro':
            dezembro = 'active'
            meshoje = '12'
            break;
    }
    dataini = String(anotitulo) + meshoje + '01'
    datafim = String(anotitulo) + meshoje + '30'
    dataini = parseFloat(dataini)
    datafim = parseFloat(datafim)
    //console.log('anotitulo=>' + anotitulo)
    //console.log('meshoje=>' + meshoje)
    //console.log('mestitulo=>' + mestitulo)
    //console.log('dataini=>' + dataini)
    //console.log('datafim=>' + datafim)
    var sql = {}
    sql = { user: id, feito: true, liberar: true, prjfeito: false, tarefa: { $exists: false }, insres: req.body.instalador, nome_projeto: { $exists: true }, $or: [{ 'dtinibusca': { $lte: datafim, $gte: dataini } }, { 'dtfimbusca': { $lte: datafim, $gte: dataini } }] }
    Pessoa.findOne({ _id: req.body.instalador }).lean().then((pessel) => {
        Pessoa.find({ user: id, funins: 'checked' }).lean().then((pessoa) => {
            Equipe.find(sql).then((equipe) => {
                equipe.forEach((e) => {
                    //console.log('e._id=>' + e._id)
                    //console.log('e._id=>' + e.insres)
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

                        //console.log('dif=>' + dif)
                        //console.log('dia=>' + dia)
                        //console.log('mes=>' + mes)
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
                        //console.log('color=>' + color)
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
                        //console.log('q=>' + q)
                        if (q == equipe.length) {
                            res.render('principal/agenda', {
                                dia01, dia02, dia03, dia04, dia05, dia06, dia07, dia08, dia09, dia10,
                                dia11, dia12, dia13, dia14, dia15, dia16, dia17, dia18, dia19, dia20, pessel,
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
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontra a pessoa.')
        res.redirect('/dashboard')
    })
});

router.get('/agenda/', ehAdmin, (req, res) => {

    const { _id } = req.user
    const { user } = req.user
    var id

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    var dia
    var hoje = dataHoje()
    var ano = hoje.substring(0, 4)
    var meshoje = hoje.substring(5, 7)

    if (meshoje < 10) {
        mes = '0' + meshoje
    }

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

    var dataini = String(ano) + String(meshoje) + '01'
    var datafim = String(ano) + String(meshoje) + '31'

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
    var fevereiro = ' '
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
    var mestitulo = ''

    var q = 0

    //console.log('meshoje=>' + meshoje)

    switch (String(meshoje)) {
        case '01': janeiro = 'active'
            mestitulo = 'Janeiro'
            break;
        case '02': fevereiro = 'active';
            mestitulo = 'Fevereiro'
            break;
        case '03': marco = 'active';
            mestitulo = 'Março'
            break;
        case '04': abril = 'active';
            mestitulo = 'Abril'
            break;
        case '05': maio = 'active';
            mestitulo = 'Maio'
            break;
        case '06': junho = 'active';
            mestitulo = 'Junho'
            break;
        case '07': julho = 'active';
            mestitulo = 'Julho'
            break;
        case '08': agosto = 'active';
            mestitulo = 'Agosto'
            break;
        case '09': setembro = 'active';
            mestitulo = 'Setembro'
            break;
        case '10': outubro = 'active';
            mestitulo = 'Outubro'
            break;
        case '11': novembro = 'active';
            mestitulo = 'Novembro'
            break;
        case '12': dezembro = 'active';
            mestitulo = 'Dezembro'
            break;
    }
    var sql
    //console.log('mestitulo=>' + mestitulo)
    // var nova_dataini = dataini
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
                        Servico.findOne({ _id: e.servico }).then((ser) => {
                            var dias = []
                            var feito = false
                            // dias = e.dias
                            q++
                            dtinicio = e.dataini
                            // dtfim = e.datafim
                            anoinicio = dtinicio.substring(0, 4)
                            anofim = dtinicio.substring(0, 4)
                            mesinicio = dtinicio.substring(5, 7)
                            mesfim = dtinicio.substring(5, 7)
                            diainicio = dtinicio.substring(8, 11)
                            diafim = dtinicio.substring(8, 11)
                            //console.log("meshoje=>" + meshoje)
                            //console.log("mesinicio=>" + mesinicio)
                            if (naoVazio(e.programacao)) {
                                mes = mesinicio
                                dia = diainicio
                                dif = 1
                            } else {
                                if (meshoje == mesinicio) {
                                    mes = mesinicio
                                    if (anofim == anoinicio) {
                                        dia = diainicio
                                        dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                    } else {
                                        if (meshoje == 1 || meshoje == 3 || meshoje == 5 || meshoje == 7 || meshoje == 8 || meshoje == 10 || meshoje == 12) {
                                            dif = 31 - parseFloat(diainicio) + 1
                                        } else {
                                            dif = 30 - parseFloat(diainicio) + 1
                                        }
                                        if (diainicio < 10) {
                                            dia = '0' + parseFloat(diainicio)
                                        } else {
                                            dia = parseFloat(diainicio)
                                        }
                                    }
                                } else {
                                    //console.log('diferente')
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
                                            if (mes == meshoje) {
                                                break;
                                            }
                                        }

                                        if (parseFloat(anofim) > parseFloat(anoinicio)) {
                                            dia = '01'
                                            if (meshoje == 1 || meshoje == 3 || meshoje == 5 || meshoje == 7 || meshoje == 8 || meshoje == 10 || meshoje == 12) {
                                                dif = 31
                                            } else {
                                                dif = 30
                                            }
                                        } else {
                                            dia = diainicio
                                            dif = parseFloat(diafim) - parseFloat(diainicio) + 1
                                        }
                                    }
                                }
                            }
                            const { dataini } = e
                            //console.log('dataini=>' + dataini)
                            //console.log('mes_busca=>' + mes_busca)
                            //console.log(' ser.descricao=>' + ser.descricao)
                            tarefa = ser.descricao
                            for (i = 0; i < dif; i++) {
                                //console.log('dia=>' + dia)
                                //console.log('entrou laço')
                                //console.log("meshoje=>" + meshoje)
                                //console.log("mes=>" + mes)
                                if (meshoje == mes) {
                                    //console.log("dias=>" + dias)
                                    // if (naoVazio(dias)) {
                                    //     //console.log('d=>' + d)
                                    //     feito = dias[i].feito
                                    //     //console.log('feito=>' + feito)
                                    // }
                                    cor = 'lightgray'
                                    sql = { cliente: cliente.nome, id: e._id, tarefa, cor, concluido: e.concluido }
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
                            //console.log('q=>' + q)
                            //console.log('lista_tarefas.length=>' + lista_tarefas.length)
                            if (q == lista_tarefas.length) {
                                res.render('principal/agenda', {
                                    dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                                    dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                                    dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                                    dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                                    dia29, dia30, dia31, checkTesk: 'checked', checkInst: 'unchecked',
                                    mes, anotitulo: ano, todos_clientes, meshoje, mestitulo, janeiro, fevereiro, marco, abril, maio, junho,
                                    julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true
                                })
                            }
                        })
                    })
                })
            } else {
                //console.log("q=>" + q)
                //console.log("lista_tarefas.length=>" + lista_tarefas.length)
                if (q == lista_tarefas.length) {
                    res.render('principal/agenda', {
                        dia01, dia02, dia03, dia04, dia05, dia06, dia07,
                        dia08, dia09, dia10, dia11, dia12, dia13, dia14,
                        dia15, dia16, dia17, dia18, dia19, dia20, dia21,
                        dia22, dia23, dia24, dia25, dia26, dia27, dia28,
                        dia29, dia30, dia31,
                        mes, anotitulo: ano, todos_clientes, mestitulo, meshoje, janeiro, fevereiro, marco, abril, maio, junho,
                        julho, agosto, setembro, outubro, novembro, dezembro, tarefas: true
                    })
                }
            }
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente.')
            res.redirect('/gerenciamento/agenda/')
        })
    })
});

router.post('/adicionar', ehAdmin, (req, res) => {
    const { email_agenda } = req.user
    const { _id } = req.user
    const { user } = req.user
    var id
    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }
    // Get date-time string for calender
    // const dateTimeForCalander = () => {

    //     let date = new Date();

    //     let year = date.getFullYear();
    //     let month = date.getMonth() + 1;
    //     if (month < 10) {
    //         month = `0${month}`;
    //     }
    //     let day = date.getDate();
    //     if (day < 10) {
    //         day = `0${day}`;
    //     }
    //     let hour = date.getHours();
    //     if (hour < 10) {
    //         hour = `0${hour}`;
    //     }
    //     let minute = date.getMinutes();
    //     if (minute < 10) {
    //         minute = `0${minute}`;
    //     }


    //     let newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`;

    //     let event = new Date(Date.parse(newDateTime));

    //     let startDate = event;
    //     // Delay in end time is 1
    //     let endDate = new Date(new Date(startDate).setHours(startDate.getHours() + 1));

    //     return {
    //         'start': startDate,
    //         'end': endDate
    //     }
    // }

    // // Insert new event to Google Calendar
    const insertEvent = async (event) => {

        try {
            let response = await calendar.events.insert({
                auth: auth,
                calendarId: email_agenda,
                resource: event
            });

            if (response['status'] == 200 && response['statusText'] === 'OK') {
                return 1
            } else {
                return 0
            }
        } catch (error) {
            console.log(`Error at insertEvent --> ${error}`)
            return 0
        }
    }

    // console.log('req.body.cliente=>' + req.body.cliente)
    // console.log('req.body.responsavel=>' + req.body.responsavel)
    // console.log('req.body.descricao=>' + req.body.descricao)
    // console.log('data=>' + req.body.data)
    // console.log('agenda=>' + req.body.idagenda)
    // console.log('req.body.id=>' + req.body.id)
    Projeto.findOne({ _id: req.body.id }).then((projeto) => {
        Cliente.findOne({ _id: req.body.cliente }).then((cliente) => {
            // console.log("achou cliente")
            let dataini = new Date(Date.parse(req.body.data))
            // console.log('dataini=>'+dataini)
            let datafim = new Date(new Date(dataini).setHours(dataini.getHours() + 1))
            // console.log('datafim=>'+datafim)
            var idagenda
            if (naoVazio(req.body.idagenda)) {
                idagenda = req.body.idagenda
            } else {
                idagenda = '111111111111111111111111'
            }
            // console.log('idagenda=>'+idagenda)
            Agenda.findOne({ _id: idagenda }).then((achou_agenda) => {
                // console.log('achou_agenda=>'+achou_agenda)
                if (naoVazio(achou_agenda)) {
                    achou_agenda.data = req.body.data
                    achou_agenda.descricao = achou_agenda.descricao + '\n' + "[" + req.body.data + "]" + '\n' + req.body.descricao
                    achou_agenda.save().then(() => {
                        let event = {
                            'summary': cliente.nome,
                            'description': req.body.descricao,
                            'start': {
                                'dateTime': dataini,
                                'timeZone': 'America/Sao_Paulo'
                            },
                            'end': {
                                'dateTime': datafim,
                                'timeZone': 'America/Sao_Paulo'
                            }
                        }

                        insertEvent(event)
                            .then((response) => {
                                console.log(response)
                                req.flash("success_msg", "Agenda marcada.")
                                if (req.body.voltar == 'dashboard'){
                                    res.redirect('/dashboard')
                                }else{
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                }
                            })
                            .catch((err) => {
                                console.log(err)
                                req.flash('error_msg', 'Houve um erro ao salvar a agenda.')
                                res.redirect('/gerenciamento/orcamento/' + req.body.id)
                            })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve um erro ao salvar a agenda.')
                        res.redirect('/gerenciamento/orcamento/' + req.body.id)
                    })
                } else {

                    const corpo = {
                        user: id,
                        cliente: cliente._id,
                        pessoa: req.body.vendedor,
                        data: req.body.data,
                        descricao: "[" + req.body.data + "] - " + req.body.descricao
                    }
                    console.log('corpo=>' + corpo)
                    new Agenda(corpo).save().then(() => {
                        projeto.futuro = true
                        projeto.status = 'Futuro'
                        var data = String(req.body.data)
                        var ano = data.substring(0, 4)
                        var mes = data.substring(5, 7)
                        var dia = data.substring(8, 10)
                        data = ano + '-' + mes + '-' + dia
                        projeto.save().then(() => {
                            // let dateTime = dateTimeForCalander()
                            // Event for Google Calendar

                            let event = {
                                'summary': cliente.nome,
                                'description': 'Notificação Vimmus: - ' + req.body.descricao,
                                'start': {
                                    'dateTime': dataini,
                                    'timeZone': 'America/Sao_Paulo'
                                },
                                'end': {
                                    'dateTime': datafim,
                                    'timeZone': 'America/Sao_Paulo'
                                }
                            }
                            console.log('salvar agenda google')
                            insertEvent(event)
                                .then((response) => {
                                    console.log(response)
                                    req.flash("success_msg", "Agenda marcada.")
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                                .catch((err) => {
                                    console.log(err)
                                    req.flash('error_msg', 'Houve um erro ao salvar a agenda.')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve um erro ao salvar a agenda.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    }).catch((err) => {
                        req.flash('error_msg', 'Houve um erro ao salvar o projeto.')
                        res.redirect('/gerenciamento/orcamento/' + req.body.id)
                    })
                }
            })

        }).catch((err) => {
            req.flash('error_msg', 'Houve um erro ao encontrar o cliente.')
            res.redirect('/gerenciamento/orcamento/' + req.body.id)
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro ao encontrar o projeto.')
        res.redirect('/gerenciamento/orcamento/' + req.body.id)
    })
})

// Get all the events between two dates
// const getEvents = async (dateTimeStart, dateTimeEnd) => {

//     try {
//         let response = await calendar.events.list({
//             auth: auth,
//             calendarId: calendarId,
//             timeMin: dateTimeStart,
//             timeMax: dateTimeEnd,
//             timeZone: 'Asia/Kolkata'
//         });

//         let items = response['data']['items'];
//         return items;
//     } catch (error) {
//         console.log(`Error at getEvents --> ${error}`);
//         return 0;
//     }
// };

// // let start = '2020-10-03T00:00:00.000Z';
// // let end = '2020-10-04T00:00:00.000Z';

// // getEvents(start, end)
// //     .then((res) => {
// //         console.log(res);
// //     })
// //     .catch((err) => {
// //         console.log(err);
// //     });

// // Delete an event from eventID
// const deleteEvent = async (eventId) => {

//     try {
//         let response = await calendar.events.delete({
//             auth: auth,
//             calendarId: calendarId,
//             eventId: eventId
//         });

//         if (response.data === '') {
//             return 1;
//         } else {
//             return 0;
//         }
//     } catch (error) {
//         console.log(`Error at deleteEvent --> ${error}`);
//         return 0;
//     }
// };

// let eventId = 'hkkdmeseuhhpagc862rfg6nvq4';

// deleteEvent(eventId)
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     })

module.exports = router 
