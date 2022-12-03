const express = require('express');
const router  = express.Router();

const mongoose = require('mongoose');

require('../model/Pedido');
require('../model/Empresa');
require('../model/Cliente');
require('../model/Projeto');

const { ehAdmin } = require('../helpers/ehAdmin');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const Pedido = mongoose.model('pedido');
const Projeto = mongoose.model('projeto');
const Empresa = mongoose.model('empresa');
const Cliente = mongoose.model('cliente');

router.post('/pedido', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    var id

    var potencia

    var texto = ''
    var q = 0

    if (typeof user == 'undefined') {
        id = _id
    } else {
        id = user
    }

    Empresa.findOne({ user: id }).then((empresa) => {
        Projeto.findOne({ _id: req.body.id }).then((projeto) => {
            Cliente.findOne({ _id: projeto.cliente }).then((cliente) => {

                if (naoVazio(req.body.pagamento)) {
                    if (naoVazio(req.body.idpedido)) {
                        Pedido.findOne({ _id: req.body.idpedido }).then((pedido) => {
                            potencia = Math.trunc(parseFloat(req.body.plaQtdMod) * parseFloat(req.body.plaWattMod), 1) / 1000

                            pedido.vlrServico = parseFloat(req.body.vlrServico)
                            pedido.vlrKit = parseFloat(req.body.vlrKit)
                            pedido.vlrTotal = parseFloat(req.body.vlrTotal)
                            pedido.pagamento = req.body.pagamento
                            pedido.plaQtdMod = req.body.plaQtdMod
                            pedido.plaWattMod = req.body.plaWattMod
                            pedido.plaQtdInv = req.body.plaQtdInv
                            pedido.plaKwpInv = req.body.plaKwpInv
                            pedido.telhado = req.body.telhado
                            pedido.orientacao = req.body.orientacao
                            pedido.pagador = req.body.pagador
                            pedido.potencia = potencia
                            pedido.descuc = req.body.descuc
                            pedido.descug = req.body.descug
                            if (naoVazio(req.body.obs)) {
                                pedido.obs = req.body.obs
                            }
                            pedido.prazo = parseFloat(req.body.dataprazo)
                            pedido.save().then(() => {

                                projeto.vlrServico = parseFloat(req.body.vlrServico)
                                projeto.vlrKit = parseFloat(req.body.vlrKit)
                                projeto.valor = parseFloat(req.body.vlrTotal)
                                projeto.telhado = req.body.telhado
                                projeto.potencia = potencia
                                projeto.orientacao = req.body.orientacao
                                projeto.plaQtdMod = req.body.plaQtdMod
                                projeto.plaWattMod = req.body.plaWattMod
                                projeto.plaQtdInv = req.body.plaQtdInv
                                projeto.plaKwpInv = req.body.plaKwpInv
                                projeto.descuc = req.body.descuc
                                projeto.descug = req.body.descug
                                projeto.save().then(() => {
                                    req.flash('success_msg', 'Pedido salvo com sucesso.')
                                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                })
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar o pedido.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    } else {
                        potencia = Math.trunc(parseFloat(req.body.plaQtdMod) * parseFloat(req.body.plaWattMod), 1) / 1000

                        const pedido = {
                            user: id,
                            projeto: req.body.id,
                            vlrServico: parseFloat(req.body.vlrServico),
                            vlrKit: parseFloat(req.body.vlrKit),
                            vlrTotal: parseFloat(req.body.vlrTotal),
                            pagamento: req.body.pagamento,
                            plaQtdMod: req.body.plaQtdMod,
                            plaWattMod: req.body.plaWattMod,
                            plaQtdInv: req.body.plaQtdInv,
                            plaKwpInv: req.body.plaKwpInv,
                            telhado: req.body.telhado,
                            orientacao: req.body.orientacao,
                            descuc: req.body.descuc,
                            descug: req.body.descug,
                            pagador: req.body.pagador,
                            obs: req.body.obs,
                            prazo: req.body.dataprazo,
                            potencia: potencia,
                            data: dataHoje()
                        }
                        new Pedido(pedido).save().then(() => {
                            Pedido.findOne({ user: id }).sort({ field: 'asc', _id: -1 }).then((novo_pedido) => {
                                var datafim = req.body.dataprazo
                                datafim = setData(dataHoje(), datafim)

                                projeto.pedido = novo_pedido._id
                                projeto.vlrServico = parseFloat(req.body.vlrServico)
                                projeto.vlrKit = parseFloat(req.body.vlrKit)
                                projeto.valor = parseFloat(req.body.vlrTotal)
                                projeto.telhado = req.body.telhado
                                projeto.orientacao = req.body.orientacao
                                projeto.plaQtdMod = req.body.plaQtdMod
                                projeto.plaWattMod = req.body.plaWattMod
                                projeto.plaQtdInv = req.body.plaQtdInv
                                projeto.plaKwpInv = req.body.plaKwpInv

                                projeto.save().then(() => {
                                    Acesso.find({ user: id, notped: 'checked' }).then((acesso) => {
  
                                        if (naoVazio(acesso)) {
                                            acesso.forEach((e) => {
                                                Pessoa.findOne({ _id: e.pessoa }).then((pessoa) => {
                                                    q++
                                                    //console.log('pessoa=>' + pessoa)
                                                    texto = 'Olá ' + pessoa.nome + ',' + '\n' +
                                                        'PEDIDO REALIZADO!' + '\n' +
                                                        'O pedido da proposta ' + projeto.seq + ' do cliente ' + cliente.nome + ' está pronto. ' + '\n ' +
                                                        'Acesse https://quasat.vimmus.com.br/gerenciamento/orcamento/' + projeto._id + ' e acompanhe.'

                                                    //console.log('pessoa.celular=>' + pessoa.celular)

                                                    client.messages
                                                        .create({
                                                            body: texto,
                                                            from: 'whatsapp:+554991832978',
                                                            to: 'whatsapp:+55' + pessoa.celular
                                                        })
                                                        .then((message) => {
                                                            if (q == acesso.length) {
                                                                req.flash('success_msg', 'Pedido realizado com sucesso.')
                                                                res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                                            }
                                                        }).done()

                                                }).catch((err) => {
                                                    req.flash('error_msg', 'Houve um erro ao encontrar a pessoa<whats>.')
                                                    res.redirect('/dashboard')
                                                })
                                            })
                                        } else {
                                            req.flash('success_msg', 'Pedido realizado com sucesso.')
                                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                                        }
                                    }).catch((err) => {
                                        req.flash('error_msg', 'Houve um erro ao encontrar o acesso.')
                                        res.redirect('/dashboard')
                                    })
                                })
                            }).catch((err) => {
                                req.flash('error_msg', 'Houve erro ao salvar o pedido.')
                                res.redirect('/gerenciamento/orcamento/' + req.body.id)
                            })
                        }).catch((err) => {
                            req.flash('error_msg', 'Houve erro ao encontrar o projeto.')
                            res.redirect('/gerenciamento/orcamento/' + req.body.id)
                        })
                    }
                } else {
                    req.flash('error_msg', 'É necessário preencher a condição de pagamento!')
                    res.redirect('/gerenciamento/orcamento/' + req.body.id)
                }
            })
        })
    }).catch((err) => {
        req.flash('error_msg', 'Houve erro ao encontrar a empresa.')
        res.redirect('/gerenciamento/orcamento/' + req.body.id)
    })
});

module.exports = router;