const express = require('express');
const router = express.Router();

const mongoose  = require("mongoose");

require('../model/Projeto');
require('../model/Cliente');
require('../model/Tarefas');
require('../model/Equipe');

const {ehAdmin} = require('../helpers/ehAdmin');

const Tarefas = mongoose.model('tarefas');
const Projeto = mongoose.model('projeto');
const Cliente = mongoose.model('cliente');
const Equipe = mongoose.model('equipe');

router.get('/instalacao/:id', ehAdmin, (req, res) => {
    const { _id } = req.user
    const { user } = req.user
    const { vendedor } = req.user
    const { funges } = req.user
    const { funpro } = req.user
    const { orcamentista } = req.user

    var tarefas = []
    var check = false
    var contaDias = 0
    var entrega = true
    var termo = false
    var realizado = false
    var prjtermo
    var desctermo
    var dataini = '0000-00-00'
    var datafim = '0000-00-00'
    var ehMaster
    //console.log('req.params.id=>' + req.params.id)

    if (naoVazio(user)) {
        ehMaster = false
        id = user
    } else {
        ehMaster = true
        id = _id
    }

    if (funpro || funges) {
        proandges = true
    } else {
        proandges = false
    }

    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        if (naoVazio(projeto.termo)) {
            termo = true
            prjtermo = projeto.termo
            desctermo = prjtermo[0].desc
        }
        Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {
            Tarefas.find({ projeto: req.params.id }).then((tarefa) => {
                //console.log('tarefa=>' + tarefa)
                if (naoVazio(tarefa)) {
                    tarefa.forEach((e) => {
                        //console.log('tarefas._id=>' + e._id)
                        if (e.concluido != true) {
                            entrega = false
                        }

                        if (naoVazio(e.dataini)) {
                            dataini = e.dataini
                            if (naoVazio(e.datafim)) {
                                datafim = e.datafim
                                contaDias = diferencaDias(e.dataini, e.datafim)
                            } else {
                                contaDias = diferencaDias(e.dataini, dataHoje())
                            }

                        } else {
                            contaDias = 0
                        }

                        if (naoVazio(e.fotos)) {
                            realizado = true
                        } else {
                            realizado = false
                        }

                        //console.log('dataini=>'+dataini)
                        //console.log('datafim=>'+datafim)

                        tarefas.push({ id: e._id, check, realizado, contaDias, descricao: e.descricao, dataini, datafim, concluido: e.concluido, emandamento: e.emandamento })
                    })
                    res.render('principal/instalacao', { desctermo, vendedor, orcamentista, funpro, proandges, funges, ehMaster, projeto, cliente_projeto, tarefas, entrega, termo })
                } else {
                    res.render('principal/instalacao', { desctermo, vendedor, orcamentista, funpro, proandges, funges, ehMaster, projeto, cliente_projeto, entrega, termo })
                }
            }).catch((err) => {
                req.flash('error_msg', 'Não foi possível encontrar as tarefas.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível encontrar o cliente.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<instalacao>.')
        res.redirect('/dashboard')
    })
});

router.get('/obsinstalacao/:id', ehAdmin, async (req, res) => {
    let observacao;
    let ObjectId = mongoose.Types.ObjectId;
    let reg = await Projeto.aggregate([
        {
            $match: {
                _id: ObjectId(String(req.params.id))
            }
        },
        {
            $lookup: {
                from: 'equipes',
                let: { id_equipe: '$equipe' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: ['$_id', "$$id_equipe"]
                        }
                    }
                }],
                as: 'equipes'
            }
        }
    ]);
    reg.map(async item => {
        if (item.equipes.length > 0) {
            let equipes = item.equipes;
            equipes.map(async i => {
                //console.log('i.observacao=>' + i.observacao)
                observacao = i.observacao;
            })
        } else {
            let equipe = await Equipe.findOne({ projeto: req.body.id });
            //console.log('equipe.observacao=>' + equipe.observacao)
            observacao = equipe.observacao;
        }
    })
    //console.log(observacao);
    res.render('principal/obsinstalador', { idprj: req.params.id, observacao });
});

router.get('/checkAtv/:id', ehAdmin, (req, res) => {
    Tarefas.findOne({ _id: req.params.id }).then((tarefa) => {
        if (naoVazio(tarefa.dataini) == false) {
            tarefa.dataini = dataHoje()
        }
        //console.log('tarefa.emandamento=>'+tarefa.emandamento)
        if (naoVazio(tarefa.emandamento)) {
            if (tarefa.emandamento == true) {
                tarefa.emandamento = false
            } else {
                tarefa.emandamento = true
            }
        } else {
            tarefa.emandamento = true
        }
        tarefa.save().then(() => {
            res.redirect('/gerenciamento/listaAtividade/' + tarefa.projeto)
        }).catch((err) => {
            req.flash('error_msg', 'Não foi possível salvar a tarefa.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar a tarefa.')
        res.redirect('/dashboard')
    })
});

router.get('/listaAtividade/:id', ehAdmin, (req, res) => {
    var check
    var tarefas = []
    var checkAtv = false
    Projeto.findOne({ _id: req.params.id }).lean().then((projeto) => {
        Equipe.findOne({ _id: projeto.equipe }).lean().then((equipe) => {
            Cliente.findOne({ _id: projeto.cliente }).lean().then((cliente_projeto) => {
                Tarefas.find({ projeto: req.params.id }).lean().then((tarefa) => {
                    tarefa.forEach((e) => {
                        if (e.emandamento == true || typeof e.emadanmento != 'undefined') {
                            check = 'checked'
                            checkAtv = true
                        } else {
                            check = 'unchecked'
                            checkAtv = false
                        }
                        tarefas.push({ id: e._id, descricao: e.descricao, check, checkAtv })
                    })

                    res.render('principal/instalacao', { vendedor: false, orcamentista: false, instalador: true, id: req.params.id, projeto, equipe, cliente_projeto, tarefas })

                }).catch((err) => {
                    req.flash('error_msg', 'Falha ao encontrar as tarefas.')
                    res.redirect('/dashboard')
                })
            }).catch((err) => {
                req.flash('error_msg', 'Falha ao encontrar o cliente.')
                res.redirect('/dashboard')
            })
        }).catch((err) => {
            req.flash('error_msg', 'Falha ao encontrar a equipe.')
            res.redirect('/dashboard')
        })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao encontrar o projeto.')
        res.redirect('/dashboard')
    })
});

module.exports = router;