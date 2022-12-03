const app = require('express')();
const mongoose = require('mongoose');

const { ehAdmin } = require('../helpers/ehAdmin');

require('../model/Projeto');
require('../model/Cliente');

const Projeto = mongoose.model('projeto');
const Cliente = mongoose.model('cliente');

app.get('/termos/', ehAdmin, (req, res) => {
    var id
    const { user } = req.user
    const { _id } = req.user
    const { pessoa } = req.user
    const { funges } = req.user
    let gestor

    if (naoVazio(user)) {
        id = user
        gestor = funges
    } else {
        id = _id
        gestor = true
    }

    let projetos = [];
    let contaDias = 0;
    let tamTermo;
    let termo;
    let datatermo = '00/00/0000';
    let sql = {};
    let dataAprova = '00/00/0000';
    let dataTroca = '00/00/0000';
    let q = 0;


    if (gestor) {
        sql = { user: id, dataApro: { $exists: true }, encerrado: false }
    } else {
        sql = { user: id, vendedor: pessoa, dataTroca: { $exists: true }, encerrado: false }
    }

    Projeto.find(sql).then((projeto) => {
        if (naoVazio(projeto)) {
            projeto.forEach((e) => {
                Cliente.findOne({ _id: e.cliente }).then((cliente) => {
                    q++
                    if (naoVazio(e.dataApro)) {
                        dataAprova = e.dataApro
                    }

                    tamTermo = e.termo
                    if (tamTermo.length > 0) {
                        if (naoVazio(tamTermo[0].data)) {
                            datatermo = tamTermo[0].data
                        }
                    }

                    dataTroca = e.dataTroca
                    if (naoVazio(dataTroca)) {
                        if (datatermo != '00/00/0000') {
                            contaDias = diferencaDias(e.dataTroca, datatermo)
                            termo = true
                        } else {
                            contaDias = diferencaDias(e.dataTroca, dataHoje())
                            termo = false
                        }
                        //console.log('contaDias=>' + contaDias)
                        //console.log('termo=>' + termo)
                    }

                    // if (contaDias > 7) {
                    //     alerta = true
                    // }

                    projetos.push({
                        id: e._id,
                        termo,
                        contaDias,
                        seq: e.seq,
                        cliente: cliente.nome,
                        datatermo: dataMensagem(datatermo),
                        dataapro: dataMensagem(dataAprova),
                        datatroca: dataMensagem(dataTroca)
                    })

                    if (q == projeto.length) {
                        res.render('principal/termos', { projetos })
                    }
                }).catch((err) => {
                    req.flash('error_msg', 'Não foi possível encontrar o projeto<termo>')
                    res.redirect('/relatorios/consulta')
                })
            })
        } else {
            res.render('principal/termos')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Não foi possível encontrar o projeto<sem termo>')
        res.redirect('/relatorios/consulta')
    })
})

module.exports = app;